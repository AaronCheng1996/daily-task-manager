const levels = {
	error: 0,
	warn: 1,
	info: 2,
	verbose: 3,
	debug: 4,
};

const colors = {
	error: 'red',
	warn: 'yellow',
	info: 'cyan',
	verbose: 'white',
	debug: 'green',
};
const loggingLevelsConfig = Object.freeze({
	levels,
	colors,
});
export default loggingLevelsConfig;
