const shortHex = (str: string) => {
	return str.slice(0, 6) + "..." + str.slice(-4);
};

const StringHelper = {
	shortHex,
};

export default StringHelper;
