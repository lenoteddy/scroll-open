require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

// TODO: only allow user to get data that belong to that user only

// Middleware to verify token in headers
const verifyHeader = async (req, res, next) => {
	const token = req.headers["x-app-token"]; // Read token from headers
	if (!token) return res.status(403).json({ status: "error", message: "Forbidden: token missing" });
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("SELECT * FROM user_auth WHERE user_auth_token=?", [token]);
		const { user_auth_id, user_auth_signature, user_auth_expire_at } = result[0];
		const now = getCurrentUTCDateTime();
		const currentDatetime = new Date(now);
		const expiryDatetime = new Date(user_auth_expire_at + "Z");
		// check auth
		if (!result[0] || !user_auth_signature || currentDatetime > expiryDatetime) {
			connection.release();
			return res.status(401).json({ status: "error", message: "Unauthorized!" });
		}
		await connection.execute("UPDATE user_auth SET user_auth_expire_at=? WHERE user_auth_id=?", [now, user_auth_id]);
		connection.release();
		next();
	} catch (err) {
		console.error("Verify header failed!", err);
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
};

app.use(
	express.json(),
	express.urlencoded({ extended: true }),
	cors({
		origin: "http://localhost:5173", // Replace with frontend URL
		methods: "GET,POST,PUT,DELETE,OPTIONS",
		allowedHeaders: "Content-Type,Authorization,x-app-token",
	})
);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

app.get("/auth/token/:address", async (req, res) => {
	// user inputs
	const userAddress = req.params.address;
	const authToken = generateRandomString();
	const currentDatetime = getCurrentUTCDateTime();
	let token = "";
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [resultSelect] = await connection.execute("SELECT * FROM user_auth WHERE user_auth_address=? AND user_auth_signature='' ORDER BY user_auth_id DESC LIMIT 1", [userAddress]);
		if (resultSelect[0]) {
			const { user_auth_id, user_auth_token } = resultSelect[0];
			const [resultUpdate] = await connection.execute("UPDATE user_auth SET user_auth_token=? WHERE user_auth_id=?", [user_auth_token, user_auth_id]);
			console.log("User Auth updated!:", resultUpdate);
			token = user_auth_token;
		} else {
			const [resultInsert] = await connection.execute("INSERT INTO user_auth SET user_auth_address=?, user_auth_token=?, user_auth_created_at=?", [userAddress, authToken, currentDatetime]);
			console.log("User Auth inserted!:", resultInsert);
			token = authToken;
		}
		connection.release();
		res.json({ token });
	} catch (err) {
		console.error("Auth token error:", err);
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.post("/auth/verify", async (req, res) => {
	// user inputs
	const { address, message, signature } = req.body;
	if (!address || !message || !signature) return res.status(400).json({ status: "error", message: "Missing required fields" });
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
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.get("/plans", verifyHeader, async (_, res) => {
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [result] = await connection.execute("SELECT * FROM user_plan");
		connection.release();
		console.log("User Plan fetched!:", result);
		res.json(result);
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.get("/plans/:id", verifyHeader, async (req, res) => {
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
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.post("/plans", verifyHeader, async (req, res) => {
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
		res.json({ message: "Plan created successfully!", data: { id: resultPlan.insertId, name, source_token, destination_token, amount, frequency } });
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.put("/plans/:id", verifyHeader, async (req, res) => {
	// user inputs
	const planId = req.params.id;
	const { address, name, source_token, destination_token, amount, frequency } = req.body;
	try {
		// database transaction
		const connection = await pool.getConnection();
		const [resultPlan] = await connection.execute(
			"UPDATE user_plan SET user_plan_address=?, user_plan_name=?, user_plan_source_token=?, user_plan_destination_token=?, user_plan_amount=?, user_plan_frequency=? WHERE user_plan_id=?",
			[address, name, source_token, destination_token, amount, frequency, planId]
		);
		connection.release();
		console.log("User Plan updated!:", resultPlan);
		res.json({ message: "Plan updated successfully!", data: { name, source_token, destination_token, amount, frequency } });
	} catch (err) {
		console.error("Insert error:", err);
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.get("/transactions/:planId", verifyHeader, async (req, res) => {
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
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});

app.get("/transactions", async (req, res) => {
	// TODO: only IP from operator machine can call it

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
		res.status(500).json({ status: "error", message: "Internal server error!" });
	}
});
