function getCurrentTimestamp() {
	const now = new Date().getTime();
	return Math.floor(now / 1000);
}
function getDeadlineTimestamp(datetime, secondsToAdd) {
	let date = new Date(datetime);
	date.setSeconds(date.getSeconds() + secondsToAdd);
	return Math.floor(date.getTime() / 1000);
}

function getTimestampDatetime(timestamp) {
	const date = new Date(timestamp * 1000);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const helper = {
	getCurrentTimestamp,
	getDeadlineTimestamp,
	getTimestampDatetime,
};

module.exports = {
	helper,
};
