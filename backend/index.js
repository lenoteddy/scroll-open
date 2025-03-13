require("dotenv").config();
const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const { Wallet } = require("ethers");
const { encrypt } = require("./libraries/encryption");

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
		console.log("User Operator updated!:", resultOperator);
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
