import * as mysql from '@mysql/xdevapi';
import { HTTPError, RawAccountObject } from 'common-lib';
import * as express from 'express';
import { Configuration } from '../conf';
import Account from './Account';

export function deepTypeEqual<T>(obj1: T, obj2: any): obj2 is T {
	if (typeof obj2 !== typeof obj1) {
		return false;
	}

	if (typeof obj1 !== 'object') {
		return true;
	}

	for (const i in obj1) {
		if (obj1.hasOwnProperty(i)) {
			if (typeof obj1[i] !== typeof obj2[i]) {
				return false;
			}

			if (!deepTypeEqual(obj1[i], obj2[i])) {
				return false;
			}
		}
	}

	return true;
}

export function extend<T, S>(obj1: T, obj2: S): T & S {
	const ret = {} as any;
	for (const i in obj1) {
		if (obj1.hasOwnProperty(i)) {
			ret[i] = obj1[i];
		}
	}
	for (const i in obj2) {
		if (obj2.hasOwnProperty(i)) {
			ret[i] = obj2[i];
		}
	}
	return ret;
}

export async function orderlyExecute<T, S>(
	promiseFunction: (val: S) => Promise<T>,
	values: S[]
): Promise<T[]> {
	const ret: T[] = [];
	for (const i of values) {
		ret.push(await promiseFunction(i));
	}
	return ret;
}

export const json = <T>(res: express.Response, values: T | Promise<T>) =>
	values instanceof Promise
		? values.then(val => {
				res.json(values);
		  })
		: res.json(values);

export async function streamAsyncGeneratorAsJSONArray<T>(
	res: express.Response,
	iterator: AsyncIterableIterator<T>,
	functionHandle: (val: T) => Promise<string | false> | string | false = JSON.stringify
): Promise<void> {
	res.header('Content-type', 'application/json');

	let started = false;

	for await (const i of iterator) {
		const value = await functionHandle(i);
		if (value !== false) {
			res.write((started ? ',' : '[') + value);
			started = true;
		}
	}

	// Will happen if the iterator returned nothing, or the map
	// function returned false for every item
	if (!started) {
		res.write('[');
	}

	res.write(']');
	res.end();
}

export async function streamAsyncGeneratorAsJSONArrayTyped<T, R>(
	res: express.Response,
	iterator: AsyncIterableIterator<T>,
	functionHandle: (val: T) => Promise<R | false> | R | false
): Promise<void> {
	streamAsyncGeneratorAsJSONArray(res, iterator, async val => {
		const x = (await functionHandle(val)) as any;
		if (x === false) {
			return x;
		} else {
			return JSON.stringify(x);
		}
	});
}

let testSession: mysql.Session, testAccount: Account;

export async function getTestTools(testconf: typeof Configuration) {
	const devAccount: RawAccountObject = {
		adminIDs: [
			{
				id: 542488,
				type: 'CAPNHQMember'
			}
		],
		echelon: false,
		expires: 99999999999999,
		id: 'mdx89',
		mainOrg: 916,
		orgIDs: [916, 2529],
		paid: true,
		paidEventLimit: 500,
		unpaidEventLimit: 5
	};

	const conn = testconf.database.connection;

	testSession =
		testSession ||
		(await mysql.getSession({
			user: conn.user,
			password: conn.password,
			host: conn.host,
			port: conn.port
		}));

	const schema = testSession.getSchema(testconf.database.connection.database);

	try {
		testAccount = await Account.Get('mdx89', schema);
	} catch (e) {
		testAccount = await Account.Create(devAccount, schema);
	}

	return {
		account: testAccount,
		schema
	};
}

export async function getTestTools2(
	testconf: typeof Configuration
): Promise<[Account, mysql.Schema]> {
	const results = await getTestTools(testconf);

	return [results.account, results.schema];
}

export interface ExtendedResponse extends express.Response {
	sjson: <T>(obj: T | HTTPError) => ExtendedResponse;
}

const convertResponse = (res: express.Response): ExtendedResponse => {
	(res as ExtendedResponse).sjson = <T>(obj: T | HTTPError) => convertResponse(res.json(obj));
	return res as ExtendedResponse;
};

export const extraTypes = (func: (req: express.Request, res: ExtendedResponse) => void) => (
	req: express.Request,
	res: express.Response
) => {
	func(req, convertResponse(res));
};

type ExpressHandler = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => any;

export const asyncErrorHandler = (fn: ExpressHandler): ExpressHandler => (req, res, next) =>
	fn(req, res, next).then(next, next);

export const replaceUndefinedWithNull = (obj: any) => {
	for (const i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (obj[i] === undefined) {
				obj[i] = null;
			} else if (typeof obj[i] === 'object') {
				replaceUndefinedWithNull(obj[i]);
			}
		}
	}
};

export const replaceUndefinedWithNullMiddleware: express.RequestHandler = (req, res, next) => {
	replaceUndefinedWithNull(req.body);

	next();
};

export type MonthNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const getTargetMonth = (timestamp: number): MonthNumber => {
	const date = new Date(timestamp);

	return date.getMonth() as MonthNumber;
};

export const getTargetYear = (timestamp: number): number => {
	const date = new Date(timestamp);

	return date.getFullYear();
};
