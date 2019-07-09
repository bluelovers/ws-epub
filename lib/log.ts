import { Console } from 'debug-color2';

export const console = new Console(null, {
	enabled: true,
	inspectOptions: {
		colors: true,
	},
	chalkOptions: {
		enabled: true,
	},
});

console.enabledColor = true;

export default console