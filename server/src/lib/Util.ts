import * as mysql from '@mysql/xdevapi';
import { HTTPError, MultCheckboxReturn, RawAccountObject } from 'common-lib';
import * as express from 'express';
import { Configuration } from '../conf';
import { Account } from './internals';

export function extend<T extends object, S extends object>(obj1: T, obj2: S): T & S {
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

// Maybe can be used to help with JSON serialization? Doesn't seem to work...
// type FunctionLess<R> = {
// 	[P in keyof R]: R[P] extends () => void
// 		? never
// 		: R[P] extends Array<infer U>
// 		? Array<FunctionLess<U>>
// 		: R[P] extends object
// 		? FunctionLess<R[P]>
// 		: R[P]
// };

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

let testSession: mysql.Session;

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

	let testAccount: Account;
	try {
		testAccount = await Account.Get('mdx89', schema);
	} catch (e) {
		testAccount = await Account.Create(devAccount, schema);
	}

	return {
		account: testAccount,
		schema,
		session: testSession
	};
}

export async function getTestTools2(
	testconf: typeof Configuration
): Promise<[Account, mysql.Schema, mysql.Session]> {
	const results = await getTestTools(testconf);

	return [results.account, results.schema, results.session];
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
	fn(req, res, next).catch(next);

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

export const presentMultCheckboxReturn = (
	value: MultCheckboxReturn,
	labels: string[],
	other: boolean,
	separator = ', '
) => {
	const arrayValue = labels.filter((label, i) => value[0][i]);
	if (other && value[0][labels.length]) {
		arrayValue.push(value[1]);
	}

	return arrayValue.join(separator);
};

export function formatPhone(phone: string) {
	// strip spaces and non-numeric characters
	phone.trimLeft().trimRight();
	// add 2 dots
	return phone.substring(0,3) + "." + phone.substring(3,6) + "." + phone.substring(6,10);
}

/*
str = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It w as popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

str = wordWrap(str, 40);

function commentsBlock(str, maxWidth) {
    var newLineStr = "\n"; done = false; res = '';
    while (str.length > maxWidth) {                 
        found = false;
        // Inserts new line at first whitespace of the line
        for (i = maxWidth - 1; i >= 0; i--) {
            if (testWhite(str.charAt(i))) {
                res = res + [str.slice(0, i), newLineStr].join('');
                str = str.slice(i + 1);
                found = true;
                break;
            }
        }
        // Inserts new line at maxWidth position, the word is too long to wrap
        if (!found) {
            res += [str.slice(0, maxWidth), newLineStr].join('');
            str = str.slice(maxWidth);
        }

    }

    return res + str;
}

function testWhite(x) {
    var white = new RegExp(/^\s$/);
    return white.test(x.charAt(0));
};
*/
