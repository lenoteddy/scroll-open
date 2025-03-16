const shortHex = (str: string) => {
	return str.slice(0, 6) + "..." + str.slice(-4);
};

const formatUnixTimestamp = (timestamp: number) => {
	const date = new Date(timestamp * 1000); // Convert to milliseconds
	return (
		date.toLocaleString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
			timeZone: "UTC",
		}) + " UTC"
	);
};

const StringHelper = {
	shortHex,
	formatUnixTimestamp,
};

export default StringHelper;
