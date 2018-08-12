import * as ajv from 'ajv';
import * as express from 'express';
import { join } from 'path';
import conf from '../conf';

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

export function json<T>(res: express.Response, values: T): void {
	res.json(values);
}

export function getSchemaValidator(schema: any) {
	return new ajv({ allErrors: true }).compile(schema);
}

export function getFullSchemaValidator<T>(schemaName: string) {
	const schema = require(join(conf.schemaPath, schemaName));

	const privateValidator = new ajv({ allErrors: true }).compile(schema);

	return (val: any): val is T => privateValidator(val) as boolean;
}
