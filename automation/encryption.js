require("dotenv").config();
const crypto = require("crypto");

const SECRET_KEY = process.env.OPERATORS_SECRET;
if (!SECRET_KEY || SECRET_KEY.length !== 32) throw new Error("SECRET_KEY must be exactly 32 characters long.");
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts a text using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in base64 format
 */
function encrypt(text) {
	const iv = crypto.randomBytes(16); // Generate a random IV
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
	let encrypted = cipher.update(text, "utf8", "base64");
	encrypted += cipher.final("base64");
	const authTag = cipher.getAuthTag(); // Get authentication tag
	return `${iv.toString("base64")}.${encrypted}.${authTag.toString("base64")}`;
}

/**
 * Decrypts an encrypted text using AES-256-GCM
 * @param {string} encryptedData - The encrypted text in base64 format
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedData) {
	const parts = encryptedData.split(".");
	if (parts.length !== 3) {
		throw new Error("Invalid encrypted data format");
	}
	const iv = Buffer.from(parts[0], "base64");
	const encryptedText = parts[1];
	const authTag = Buffer.from(parts[2], "base64");
	const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
	decipher.setAuthTag(authTag);
	let decrypted = decipher.update(encryptedText, "base64", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

module.exports = { encrypt, decrypt };
