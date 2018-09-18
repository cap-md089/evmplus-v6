import * as mysql from '@mysql/xdevapi';
import * as ajv from 'ajv';
import * as express from 'express';
import { join } from 'path';
import conf, { Configuration } from '../conf';
import Account from './Account';

export function extend<T>(obj1: T, obj2: Partial<T>): T {
	const ret = {} as T;
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

export const json = <T>(res: express.Response, values: T) => res.json(values);

export const getSchemaValidator = (schema: any) => new ajv({ allErrors: true }).compile(schema);

export function getFullSchemaValidator<T>(schemaName: string) {
	const schema = require(join(conf.schemaPath, schemaName));

	const privateValidator = new ajv({ allErrors: true }).compile(schema);

	return (val: any): val is T => privateValidator(val) as boolean;
}

export async function streamAsyncGeneratorAsJSONArray<T>(
	res: express.Response,
	iterator: AsyncIterableIterator<T>,
	functionHandle: (val: T) => string | false
): Promise<void> {
	res.header('Content-type', 'application/json');

	let started = false;

	for await (const i of iterator) {
		const value = functionHandle(i);
		if (value !== false) {
			res.write(started ? ',' : '[ ' + value);
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

export async function getTestTools(testconf: typeof Configuration) {
	const conn = testconf.database.connection;

	const session = await mysql.getSession({
		user: conn.user,
		password: conn.password,
		host: conn.host,
		port: conn.port
	});

	const schema = session.getSchema(testconf.database.connection.database);

	const testAccount = await Account.Get('mdx89', schema);

	return {
		account: testAccount,
		schema
	};
}
