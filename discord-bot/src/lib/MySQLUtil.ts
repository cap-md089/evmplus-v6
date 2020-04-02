import * as mysql from '@mysql/xdevapi';
import { ServerConfiguration } from 'common-lib';

export const getSession = (configuration: ServerConfiguration) => {
	const { host, password, port: mysqlPort, user } = configuration.database.connection;

	return mysql.getSession({
		host,
		password,
		port: mysqlPort,
		user
	});
};

export const prettySQL = (text: TemplateStringsArray): string => {
	return text[0].replace(/[\n\t]/g, ' ').replace(/ +/g, ' ');
};

export const collectResults = async <T>(
	find: mysql.CollectionFind<T> | mysql.TableSelect<T>
): Promise<T[]> => {
	const ret: T[] = [];

	// The promise is resolved once the execute callback is called multiple times
	try {
		await find.execute(item => {
			ret.push(item);
		});
	} catch (e) {
		throw new Error(e);
	}

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

	const findResult = find
		.execute(o => results.push(o))
		.then(() => {
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

	try {
		await findResult;
	} catch (e) {
		throw new Error(e);
	}
};

export const safeBind = <T, C extends mysql.Binding<T>>(find: C, bind: any): C => {
	// Checks for any value being undefined, as MySQL xDevAPI has terrible
	// error checking
	generateBindObject(bind);

	return find.bind(bind) as C;
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
		.map(key => {
			if (bind[key as keyof T] === undefined) {
				console.error(bind);
				throw new Error(`Cannot bind with an undefined value: key is ${key}`);
			}

			return typeof bind[key as keyof T] === 'object'
				? generateBindObject(bind[key as keyof T]!, scope === null ? key : `${scope}${key}`)
				: { [scope === null ? key : `${scope}${key}`]: bind[key as keyof T] };
		})
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

export const collectGenerator = async <T>(gen: AsyncIterableIterator<T>): Promise<T[]> => {
	const ret: T[] = [];

	for await (const i of gen) {
		ret.push(i);
	}

	return ret;
};
