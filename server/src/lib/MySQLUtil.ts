import * as mysql from '@mysql/xdevapi';
import * as express from 'express';
import { DateTime } from 'luxon';
import { Configuration } from '../conf';

export interface ParamType {
	[key: string]: string;
}

export interface MySQLRequest<P extends ParamType = {}> extends express.Request {
	mysqlx: mysql.Schema;
	mysqlxSession: mysql.Session;
	_originalUrl: string;
	params: P;
	configuration: typeof Configuration;
}

export default (
	pool: mysql.Schema,
	session: mysql.Session,
	configuration: typeof Configuration
) => {
	return (req: MySQLRequest, res: express.Response, next: express.NextFunction) => {
		req.mysqlx = pool;
		req.mysqlxSession = session;
		req.configuration = configuration;
		next();
	};
};

export const errorFunction = (response: express.Response) => {
	return (err: Error) => {
		response.status(500);
		response.end();
		// tslint:disable-next-line:no-console
		console.log(err);
	};
};

export const prettySQL = (text: TemplateStringsArray): string => {
	return text[0].replace(/[\n\t]/g, ' ').replace(/ +/g, ' ');
};

export const collectResults = async <T>(
	find: mysql.CollectionFind<T> | mysql.TableSelect<T>
): Promise<T[]> => {
	const ret: T[] = [];

	// The promise is resolved once the execute callback is called multiple times
	await find.execute(item => {
		ret.push(item);
	});

	return ret;
};

export const generateResults = async function*<T>(
	find: mysql.CollectionFind<T> | mysql.TableSelect<T>
): AsyncIterableIterator<T> {
	const results = {
		queue: [] as T[],
		callback: void 0 as ((item?: T) => void) | undefined,
		doCallback: (callback: (item?: T) => void): void => {
			if (results.queue.length > 0) {
				callback(results.queue.shift());
			} else {
				results.callback = callback;
			}
		},
		execute: (): void => {
			if (results.callback) {
				results.callback(results.queue.shift());
				results.callback = void 0;
			}
		},
		push: (item: T) => {
			results.queue.push(item);
			results.execute();
		},
		finish: () => {
			if (results.callback) {
				results.callback();
			}
		}
	};
	let done = false;

	find.execute(o => results.push(o)).then(() => {
		done = true;
		results.finish();
	});

	while (!done || results.queue.length > 0) {
		try {
			const value = await new Promise<T>((res, rej) => {
				results.doCallback(item => {
					if (!item) {
						rej();
					} else {
						res(item);
					}
				});
			});

			if (value) {
				yield value;
			}
		} catch (e) {
			done = true;
		}
	}
};

export const generateFindStatement = <T>(
	find: RecursivePartial<T>,
	scope: string | null = null
): string =>
	Object.keys(find)
		.map(val =>
			typeof find[val as keyof T] === 'object'
				? '(' +
				  generateFindStatement(
						find[val as keyof T]!,
						scope === null ? val : `${scope.replace('.', '')}.${val}`
				  ) +
				  ')'
				: scope === null
				? `${val} = :${val}`
				: `${scope}.${val} = :${scope.replace('.', '')}${val}`
		)
		.join(' AND ');

export const generateBindObject = <T>(
	bind: RecursivePartial<T>,
	scope: string | null = null
): any =>
	Object.keys(bind)
		.map(key =>
			typeof bind[key as keyof T] === 'object'
				? generateBindObject(bind[key as keyof T]!, scope === null ? key : `${scope}${key}`)
				: { [scope === null ? key : `${scope}${key}`]: bind[key as keyof T] }
		)
		.reduce((prev: any = {}, curr: any) => ({ ...prev, ...curr }));

type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends Array<infer U>
		? Array<RecursivePartial<U>>
		: T[P] extends object
		? RecursivePartial<T[P]>
		: T[P];
};

export const findAndBind = <T>(
	find: mysql.Collection<T>,
	bind: RecursivePartial<Bound<T>>
): mysql.CollectionFind<T> => {
	const findWithStatement = find.find(generateFindStatement(bind));

	const bound = generateBindObject(bind);

	for (const i in bound) {
		if (bound.hasOwnProperty(i)) {
			findWithStatement.bind(i as keyof T, bound[i]);
		}
	}

	return findWithStatement;
};

export const selectAndBind = <T>(find: mysql.Table<T>, bind: Bound<T>): mysql.TableSelect<T> =>
	find.select().bind(bind);

export const modifyAndBind = <T>(
	modify: mysql.Collection<T>,
	bind: RecursivePartial<Bound<T>>
): mysql.CollectionModify<T> => {
	const modifyWithStatement = modify.modify(generateFindStatement(bind));

	const bound = generateBindObject(bind);

	for (const i in bound) {
		if (bound.hasOwnProperty(i)) {
			modifyWithStatement.bind(i as keyof T, bound[i]);
		}
	}

	return modifyWithStatement;
};

export const updatetAndBind = <T>(modify: mysql.Table<T>, bind: Bound<T>): mysql.TableUpdate<T> =>
	modify
		.update(
			Object.keys(bind)
				.map(val => `${val} = :${val}`)
				.join(' AND ')
		)
		.bind(bind);

export const convertMySQLDateToDateTime = (datestring: string) =>
	convertMySQLTimestampToDateTime(datestring + ' 00:00:00');

export const convertNHQDate = (datestring: string): Date => {
	const values = datestring.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

	if (!values) {
		throw new Error('Invalid date format');
	}

	return new Date(parseInt(values[3], 10), parseInt(values[1], 10) - 1, parseInt(values[2], 10));
};

export const convertMySQLTimestampToDateTime = (datestring: string): DateTime => {
	const values = datestring.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/);

	if (!values) {
		throw new Error('Invalid date format');
	}

	const datetime = DateTime.utc().set({
		year: parseInt(values[1], 10),
		month: parseInt(values[2], 10),
		day: parseInt(values[3], 10),

		hour: parseInt(values[4], 10),
		minute: parseInt(values[5], 10),
		second: parseInt(values[6], 10)
	});

	return datetime;
};
