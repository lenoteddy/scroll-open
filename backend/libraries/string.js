const crypto = require("crypto");

function generateRandomString(length = 128) {
	return crypto.randomBytes(length / 2).toString("hex");
}

function getCurrentUTCDateTime() {
	const now = new Date();
	return now.toISOString().replace("T", " ").substring(0, 19);
}

module.exports = { generateRandomString, getCurrentUTCDateTime };
