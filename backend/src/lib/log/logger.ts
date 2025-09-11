import winston from 'winston';
import Env from '../../config/env.js';
import loggingLevelsConfig from '../../types/log.js';

export function createLogger({ transports, format, levels, level }: { transports: winston.transport[], format: winston.Logform.Format, levels: Record<string, number>, level: string }) {
	const logger = winston.createLogger({
		level,
		levels,
		format,
		transports,
	});
	Object.keys(loggingLevelsConfig.levels).forEach((key) => {
		const originalFn = logger[key as keyof typeof logger] as (param: any, ...args: any[]) => any;
		if (typeof originalFn === 'function') {
			(logger as any)[key] = function (param: any, ...args: any[]) {
				if ([null, undefined, NaN].includes(param) || typeof param === 'symbol') {
					param = String(param);
				}

				if (
					['string', 'number', 'boolean', 'bigint'].includes(typeof param) ||
					param instanceof Object
				) {
					param = {
						message: param,
						caller: getCurrentLocation(),
					};
				} else if (param instanceof Error) {
					(param as any)['caller'] = getCurrentLocation() as string;
				}
				return originalFn(param, ...args);
			};
		}
	});
	winston.addColors(loggingLevelsConfig.colors);

	return logger;
}

export const format = winston.format.combine(
	winston.format.errors({ stack: true }),
	winston.format.printf((params) => {
		const { level, message, stack, caller } = params;
		const ts = Math.floor(new Date().valueOf() / 1000);
		const value: {
			level: string;
			ts: number;
			msg: unknown;
			caller: unknown;
			stacktrace?: string;
		} = {
			level,
			ts,
			msg: message,
			caller,
		};
		if (stack && typeof stack === 'string') {
			value.stacktrace = stack.substring(0, 2000);
		}

		return JSON.stringify(value);
	}),
);
const logger = createLogger({
	level: Env.LOG_LEVEL,
	levels: loggingLevelsConfig.levels as Record<string, number>,
	format,
	transports: [new winston.transports.Console()],
});

export default logger;

export function getCurrentLocation() {
	const error = new Error();
	if (!error.stack) {
		return '';
	}
	const stack = error.stack;
	const stackArray = stack.split('\n');

	if (!stackArray.length) {
		return '';
	}

	const callerLine = stackArray[3];
	return extractFileNameAndLineNumber(callerLine);
}

export function extractFileNameAndLineNumber(line: string) {
	const match = line.match(/\/[^\s]+:\d+:\d+/);
	if (match) {
		return match[0].replace('///', '/');
	}
	return '';
}
