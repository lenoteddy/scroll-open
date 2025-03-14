require("dotenv").config();
const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const { Wallet, ethers } = require("ethers");
const { encrypt } = require("./libraries/encryption");
const { getCurrentUTCDateTime, generateRandomString } = require("./libraries/string");

const { DB_HOST, DB_NAME, DB_USER, DB_PASS } = process.env;
const port = 3000;
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

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

app.get("/auth/token/:address", async (req, res) => {
	// user inputs
	const userAddress = req.params.address;
	const authToken = generateRandomString();
	const currentDatetime = getCurrentUTCDateTime();
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("INSERT INTO user_auth SET user_auth_address=?, user_auth_token=?, user_auth_created_at=?", [userAddress, authToken, currentDatetime]);
		connection.release();
		console.log("User Auth inserted!:", result);
		res.json({ token: authToken });
	} catch (err) {
		console.error("Auth token error:", err);
		res.status(500).send("Internal server error!");
	}
});

app.post("/auth/verify", async (_, res) => {
	// user inputs
	const { address, message, signature } = req.body;
	try {
		// verify signature
		const recoveredAddress = ethers.verifyMessage(message, signature);
		const isValid = address.toLowerCase() === recoveredAddress.toLowerCase();
		console.log("Signature is valid:", isValid);
		if (isValid) {
			// check data in database
			const connection = await pool.getConnection();
			const [resultSelect] = await connection.execute("SELECT * FROM user_auth WHERE user_auth_address=? AND user_auth_token=? AND user_auth_signature='' ORDER BY user_auth_id DESC LIMIT 1", [
				address,
				message,
			]);
			if (resultSelect[0]) {
				// update database
				const verifyAt = getCurrentUTCDateTime();
				const date = new Date(verifyAt + "Z");
				date.setHours(date.getHours() + 1);
				const expireAt = date.toISOString().replace("T", " ").substring(0, 19);
				const { user_auth_id } = resultSelect[0];
				const [resultUpdate] = await connection.execute("UPDATE user_auth SET user_auth_signature=?, user_auth_expire_at=?, user_auth_verify_at=? WHERE user_auth_id=?", [
					signature,
					expireAt,
					verifyAt,
					user_auth_id,
				]);
				console.log("User Auth updated!:", resultUpdate);
			} else {
				connection.release();
				res.json({ isValid: false });
				return;
			}
			connection.release();
		}
		res.json({ isValid: isValid });
	} catch (err) {
		console.error("Auth verify error:", err);
		res.status(500).send("Internal server error!");
	}
});

app.get("/plans", async (_, res) => {
	// TODO: do header auth check & use header user address for data queries

	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("SELECT * FROM user_plan");
		connection.release();
		console.log("User Plan fetched!:", result);
		res.json(result);
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).send("Internal server error!");
	}
});

app.get("/plans/:id", async (req, res) => {
	// TODO: do header auth check & use header user address for data queries

	// user inputs
	const planId = req.params.id;
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("SELECT * FROM user_plan WHERE user_plan_id=?", [planId]);
		connection.release();
		console.log("User Plan fetched!:", result);
		res.json(result);
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).send("Internal server error!");
	}
});

app.post("/plans", async (req, res) => {
	// TODO: do header auth check & use header user address for data queries

	// user inputs
	const { address, name, source_token, destination_token, amount, frequency } = req.body;
	try {
		// wallet generation
		const { address: operatorAddress, privateKey } = Wallet.createRandom();
		const operator = operatorAddress;
		const encrypted = encrypt(privateKey);
		// database transaction
		const connection = await pool.getConnection();
		const [resultOperator] = await connection.execute("INSERT INTO user_operator SET user_operator_address=?, user_operator_pk_encrypted=?", [operator, encrypted]);
		const [resultPlan] = await connection.execute(
			"INSERT INTO user_plan SET user_plan_operator=?, user_plan_address=?, user_plan_name=?, user_plan_source_token=?, user_plan_destination_token=?, user_plan_amount=?, user_plan_frequency=?",
			[operator, address, name, source_token, destination_token, amount, frequency]
		);
		connection.release();
		console.log("User Operator inserted!:", resultOperator);
		console.log("User Plan inserted!:", resultPlan);
		res.json({ message: "Query successfully executed!" });
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).send("Internal server error!");
	}
});

// TODO: API endpoint for update plans
app.put("/plans/:id", async (req, res) => {
	// TODO: do header auth check & use header user address for data queries

	// user inputs
	const planId = req.params.id;
	const { address, name, source_token, destination_token, amount, frequency } = req.body;
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [resultPlan] = await connection.execute(
			"UPDATE user_plan SET user_plan_name=?, user_plan_source_token=?, user_plan_destination_token=?, user_plan_amount=?, user_plan_frequency=? WHERE user_plan_id=?",
			[address, name, source_token, destination_token, amount, frequency, planId]
		);
		connection.release();
		console.log("User Plan updated!:", resultPlan);
		res.json({ message: "Query successfully executed!" });
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).send("Internal server error!");
	}
});

app.get("/transactions/:planId", async (req, res) => {
	// TODO: do header auth check & use header user address for data queries

	// user inputs
	const planId = req.params.planId;
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("SELECT * FROM user_plan_tx WHERE user_plan_id=?", [planId]);
		connection.release();
		console.log("User Plan Tx fetched!:", result);
		res.json(result);
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).send("Internal server error!");
	}
});

app.get("/transactions", async (req, res) => {
	// TODO: do header auth check only IP from operator machine can call it

	// user inputs
	const { planId, txEpoch, txInfo, txHash } = req.body;
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("INSERT INTO user_plan_tx SET user_plan_id=?, user_plan_tx_epoch=?, user_plan_tx_info=?, user_plan_tx_hash=?", [planId, txEpoch, txInfo, txHash]);
		connection.release();
		console.log("User Plan Tx inserted!:", result);
		res.json({ message: "Query successfully executed!" });
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).send("Internal server error!");
	}
});
