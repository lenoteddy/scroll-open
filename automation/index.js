require("dotenv").config();
const mysql = require("mysql2/promise");
const { ethers } = require("ethers");
const { decrypt } = require("./encryption.js");
const { helper } = require("./helper.js");
const { uniswap } = require("./uniswap.js");
const abi = require("./wallet.json");

const { DB_HOST, DB_NAME, DB_USER, DB_PASS } = process.env;
const pool = mysql.createPool({
	host: DB_HOST,
	database: DB_NAME,
	user: DB_USER,
	password: DB_PASS,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	connectTimeout: 10000,
});

const main = async () => {
	const now = helper.getCurrentTimestamp();
	const connection = await pool.getConnection();
	const [rows] = await connection.execute("SELECT * FROM user_plan");
	for (let row of rows) {
		const { user_plan_id, user_plan_last_executed, user_plan_frequency, user_plan_operator, user_plan_vault, user_plan_source_token, user_plan_destination_token, user_plan_amount } = row;
		const deadline = helper.getDeadlineTimestamp(user_plan_last_executed, user_plan_frequency);
		if (deadline <= now) {
			console.log(deadline, now, helper.getTimestampDatetime(deadline), helper.getTimestampDatetime(now));
			// 1. Execute transaction
			const [operators] = await connection.execute("SELECT * FROM user_operator WHERE user_operator_address=?", [user_plan_operator]);
			const privateKey = decrypt(operators[0].user_operator_pk_encrypted);
			const provider = new ethers.JsonRpcProvider("https://sepolia-rpc.scroll.io");
			const wallet = new ethers.Wallet(privateKey, provider);
			const contract = new ethers.Contract(user_plan_vault, abi, wallet);
			const iface = new ethers.Interface([
				"function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96))",
			]);
			const txData = iface.encodeFunctionData("exactInputSingle", [
				{
					tokenIn: user_plan_source_token,
					tokenOut: user_plan_destination_token,
					fee: 500,
					recipient: user_plan_vault,
					amountIn: ethers.parseUnits(user_plan_amount, 18),
					amountOutMinimum: 0,
					sqrtPriceLimitX96: 0,
				},
			]);
			let txInfo = `SWAP ${user_plan_amount} ETH for GHO`;
			let txHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
			try {
				const gasEstimate = await contract.estimateGas.executeTx(
					"0x17AFD0263D6909Ba1F9a8EAC697f76532365Fb95", // _contract
					user_plan_source_token, // _tokenIn
					user_plan_destination_token, // _tokenOut
					user_plan_amount, // _ethAmount
					txData, // _data
					{ from: wallet.address }
				);
				const tx = await contract.executeTx(
					"0x17AFD0263D6909Ba1F9a8EAC697f76532365Fb95", // _contract
					user_plan_source_token, // _tokenIn
					user_plan_destination_token, // _tokenOut
					user_plan_amount, // _ethAmount
					txData, // _data
					{ gasLimit: gasEstimate }
				);
				console.log("Transaction hash:", tx.hash);
				txHash = tx.hash;
			} catch (error) {
				console.error("Error writing to contract:", error);
			}

			// 2. Insert data to `user_plan_tx` table
			const [insertResult] = await connection.execute("INSERT INTO user_plan_tx SET user_plan_id=?, user_plan_tx_epoch=?, user_plan_tx_info=?, user_plan_tx_hash=?", [
				user_plan_id,
				now,
				txInfo,
				txHash,
			]);
			console.log(insertResult);

			// 3. Update execute_time into `user_plan`
			await connection.execute("UPDATE user_plan SET user_plan_last_executed=? WHERE user_plan_id=?", [helper.getTimestampDatetime(now), user_plan_id]);
		}
	}
	connection.release();
	// console.log("EOT: End of Task");
};

setInterval(main, process.env.CHECK_INTERVAL);
