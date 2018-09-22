import * as mysql from '@mysql/xdevapi';
import * as express from 'express';
import { DateTime } from 'luxon';

export interface MySQLRequest extends express.Request {
	mysqlx: mysql.Schema;
	_originalUrl: string;
}

export default (pool: mysql.Schema): express.RequestHandler => {
	return (req: MySQLRequest, res, next) => {
		req.mysqlx = pool;
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
		callback: void 0 as ((item?: T) => void | undefined),
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
				results.doCallback((item) => {
					if (!item) {
						rej();
					} else {
						res(item);
					}
				});
			});

			if (value) {
				yield value
			}
		} catch (e) {
			done = true;
		}
	}
};

export const findAndBind = <T>(
	find: mysql.Collection<T>,
	bind: Partial<T>
): mysql.CollectionFind<T> =>
	find
		.find(
			Object.keys(bind)
				.map(val => `${val} = :${val}`)
				.join(' AND ')
		)
		.bind(bind);

export const selectAndBind = <T>(
	find: mysql.Table<T>,
	bind: Partial<T>
): mysql.TableSelect<T> => find.select().bind(bind);

export const modifyAndBind = <T>(
	modify: mysql.Collection<T>,
	bind: Partial<T>
): mysql.CollectionModify<T> =>
	modify
		.modify(
			Object.keys(bind)
				.map(val => `${val} = :${val}`)
				.join(' AND ')
		)
		.bind(bind);

export const updatetAndBind = <T>(
	modify: mysql.Table<T>,
	bind: Partial<T>
): mysql.TableUpdate<T> => modify.update().bind(bind);

export const convertMySQLDateToDateTime = (datestring: string) =>
	convertMySQLTimestampToDateTime(datestring + ' 00:00:00');

export const convertNHQDate = (datestring: string): Date => {
	const values = datestring.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

	if (!values) {
		throw new Error('Invalid date format');
	}

	return new Date(
		parseInt(values[3], 10),
		parseInt(values[0], 10) - 1,
		parseInt(values[1], 10)
	);
};

export const convertMySQLTimestampToDateTime = (
	datestring: string
): DateTime => {
	const values = datestring.match(
		/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/
	);

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
