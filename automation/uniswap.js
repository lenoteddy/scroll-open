const { keccak256, toUtf8Bytes } = require("ethers");

function convertFunctionSignature(functionSignature) {
	return keccak256(toUtf8Bytes(functionSignature)).slice(0, 10);
}

function convertHexString(hexString) {
	hexString = hexString?.startsWith("0x") ? hexString.slice(2) : hexString; // Remove "0x" prefix if present
	return hexString.padStart(64, "0"); // Ensure the string is 40 characters long (left-pad with zeros if needed)
}

function constructTxData(functionSignature, tokenIn, tokenOut, fee, address, amountIn, amountOutMinimum, sqrtPriceLimitX96) {
	const selector = convertFunctionSignature(functionSignature);
	const tokenInHex = convertHexString(tokenIn);
	const tokenOutHex = convertHexString(tokenOut);
	const feeHex = convertHexString(fee);
	const addressHex = convertHexString(address);
	const amountInHex = convertHexString(amountIn);
	const amountOutMinimumHex = convertHexString(amountOutMinimum);
	const sqrtPriceLimitX96Hex = convertHexString(sqrtPriceLimitX96);
	return `${selector}${tokenInHex}${tokenOutHex}${feeHex}${addressHex}${amountInHex}${amountOutMinimumHex}${sqrtPriceLimitX96Hex}`;
}

const uniswap = {
	constructTxData,
};

module.exports = {
	uniswap,
};
