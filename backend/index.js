require("dotenv").config();
const express = require("express");
const app = express();
const mysql = require("mysql2");
const port = 3000;

const { DB_HOST, DB_NAME, DB_USER, DB_PASS } = process.env;

// Create the connection to database
const connection = mysql.createConnection({
	host: DB_HOST,
	database: DB_NAME,
	user: DB_USER,
	password: DB_PASS,
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

app.get("/", async (req, res) => {
	res.send("Hello World!");
});
