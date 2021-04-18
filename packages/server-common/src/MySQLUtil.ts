/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as mysql from '@mysql/xdevapi';
import {
	AccountIdentifiable,
	AccountObject,
	always,
	asyncRight,
	BasicMySQLRequest,
	destroy,
	errorGenerator,
	Identifiable,
	Maybe,
	ParamType,
	ServerError,
	TableDataType,
	TableNames,
} from 'common-lib';
import * as express from 'express';
import { DateTime } from 'luxon';
import { ServerEither } from './servertypes';

export type UpgradeRequest<T extends BasicMySQLRequest> = Omit<express.Request, 'params'> & T;

export type MySQLRequest<P extends ParamType = {}, B = any> = Omit<express.Request, 'params'> &
	BasicMySQLRequest<P, B>;

export const createFakeRequest = <P extends ParamType = {}, B = any>(
	info: BasicMySQLRequest<P, B>,
): MySQLRequest<P, B> => info as MySQLRequest<P, B>;

export const collectResults = async <T>(
	find: mysql.CollectionFind<T>,
): Promise<mysql.WithoutEmpty<T>[]> => {
	const ret: mysql.WithoutEmpty<T>[] = [];

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

export const bindForArray = (arr: any[]) => '(' + arr.map(() => '?').join(',') + ')';

export const collectSqlResults = async <T>(
	find: mysql.SqlExecute,
): Promise<mysql.WithoutEmpty<T>[]> => {
	try {
		return (await find.execute()).fetchAll().map(item => item[0]);
	} catch (e) {
		console.error(e);
		throw new Error(e);
	}
};

export const generateResults = async function* <U>(
	find: mysql.CollectionFind<U>,
): AsyncIterableIterator<mysql.WithoutEmpty<U>> {
	type T = mysql.WithoutEmpty<U>;

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
		},
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
	scope: string | null = null,
): string =>
	Object.keys(find)
		.map(val =>
			typeof find[val as keyof T] === 'object'
				? '(' +
				  generateFindStatement(
						find[val as keyof T]!,
						scope === null ? val : `${scope.replace('.', '')}.${val}`,
				  ) +
				  ')'
				: scope === null
				? `${val} = :${val}`
				: `${scope}.${val} = :${scope.replace('.', '')}${val}`,
		)
		.join(' AND ');

export const generateBindObject = <T>(
	bind: RecursivePartial<T>,
	scope: string | null = null,
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
	[P in keyof T]?: T[P] extends (infer U)[]
		? RecursivePartial<U>[]
		: T[P] extends object
		? RecursivePartial<T[P]>
		: T[P];
};

export const isDuplicateRecordError = (err: ServerError): boolean =>
	err.type === 'CRASH' &&
	(err.error as any)?.info?.msg ===
		'Document contains a field value that is not unique but required to be';

export const findAndBindC = <T>(bind: RecursivePartial<mysql.Bound<T>>) => <U extends T>(
	find: mysql.Collection<U>,
) => findAndBind(find, bind);

export const findAndBind = <T>(
	find: mysql.Collection<T>,
	bind: RecursivePartial<mysql.Bound<T>>,
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

export const modifyAndBindC = <T>(bind: RecursivePartial<mysql.Bound<T>>) => (
	modify: mysql.Collection<T>,
) => modifyAndBind(modify, bind);

export const modifyAndBind = <T>(
	modify: mysql.Collection<T>,
	bind: RecursivePartial<mysql.Bound<T>>,
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
		second: parseInt(values[6], 10),
	});

	return datetime;
};

export const addToCollection = <T>(targetCollection: mysql.Collection<T>) => (item: T) =>
	asyncRight(targetCollection.add(item).execute(), errorGenerator('Could not add item')).map(
		result => ({
			...item,
			_id: result.getGeneratedIds()[0],
		}),
	);

export const addItemToCollection = <T extends AccountIdentifiable>(item: T) => (
	targetCollection: mysql.Collection<T>,
) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		.map(collection => collection.add(item).execute())
		.map(always(item));

export const saveToCollection = <T extends Identifiable>(targetCollection: mysql.Collection<T>) => (
	item: T,
) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		.map(
			modifyAndBindC({
				id: item.id,
			}),
		)
		.map(modify => modify.patch(item).execute())
		.map(always(item));

export const saveToCollectionA = <T extends AccountIdentifiable>(
	targetCollection: mysql.Collection<T>,
) => (item: T) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		.map(
			modifyAndBindC({
				id: item.id,
				accountID: item.accountID,
			}),
		)
		.map(modify => modify.patch(item).execute())
		.map(always(item));

export const saveItemToCollectionA = <T extends AccountIdentifiable>(item: T) => (
	targetCollection: mysql.Collection<T>,
) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		.map(
			modifyAndBindC({
				id: item.id,
				accountID: item.accountID,
			}),
		)
		.map(modify => modify.patch(item).execute())
		.map(always(item));

export const deleteFromCollection = <T extends Identifiable>(
	targetCollection: mysql.Collection<T>,
) => (item: T) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		// @ts-ignore
		.map(collection => collection.remove('id = :id').bind('id', item.id))
		.map(remove => remove.execute())
		.map(always(item));

export const deleteItemFromCollectionA = <T extends AccountIdentifiable>(
	targetCollection: mysql.Collection<T>,
) => (item: T) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		.map(collection =>
			collection
				.remove('id = :id AND accountID = :accountID')
				// @ts-ignore
				.bind('id', item.id)
				// @ts-ignore
				.bind('accountID', item.accountID),
		)
		.map(remove => remove.execute())
		.map(destroy);

export const deleteFromCollectionA = <T extends AccountIdentifiable>(item: T) => (
	targetCollection: mysql.Collection<T>,
) =>
	asyncRight(targetCollection, errorGenerator('Cannot save item'))
		.map(collection =>
			collection
				.remove('id = :id AND accountID = :accountID')
				// @ts-ignore
				.bind('id', item.id)
				// @ts-ignore
				.bind('accountID', item.accountID),
		)
		.map(remove => remove.execute())
		.map(destroy);

export const getOneOfID = (idObj: Identifiable) => <T extends Identifiable>(
	targetCollection: mysql.Collection<T>,
): ServerEither<mysql.WithoutEmpty<T>> =>
	asyncRight(targetCollection, errorGenerator('Could not get items'))
		.map(
			findAndBindC<T>({
				id: idObj.id,
			} as RecursivePartial<mysql.Bound<T>>),
		)
		.map(collectResults)
		.filter(results => results.length !== 1, {
			code: 404,
			message: 'Could not find requested item',
			type: 'OTHER',
		})
		.map(([result]) => result);

export const getOneOfIDA = <T extends AccountIdentifiable>(idObj: AccountIdentifiable) => <
	U extends T
>(
	targetCollection: mysql.Collection<U>,
): ServerEither<mysql.WithoutEmpty<U>> =>
	asyncRight(targetCollection, errorGenerator('Could not get items'))
		.map(
			findAndBindC<U>({
				id: idObj.id,
				accountID: idObj.accountID,
			} as RecursivePartial<mysql.Bound<U>>),
		)
		.map(collectResults)
		.filter(results => results.length !== 1, {
			code: 404,
			message: 'Could not find requested item',
			type: 'OTHER',
		})
		.map(([result]) => result);

export const getNewID = (account: AccountObject) => (
	collection: mysql.Collection<AccountIdentifiable & { id: number }>,
) =>
	asyncRight(collection, errorGenerator('Could not get new ID'))
		.map(
			findAndBindC<AccountIdentifiable & { id: number }>({
				accountID: account.id,
			}),
		)
		.map(find => find.sort('id DESC').limit(1))
		.map(collectResults)
		.map(Maybe.fromArray)
		.map(Maybe.map<AccountIdentifiable & { id: number }, number>(i => i.id + 1))
		.map(Maybe.orSome(1));

export interface RawMySQLBackend {
	getSchema: () => mysql.Schema;
	getCollection: <T extends TableNames>(
		tableName: T,
	) => mysql.Collection<mysql.WithoutEmpty<TableDataType<T>>>;
}

export const getRawMySQLBackend = (req: BasicMySQLRequest): RawMySQLBackend => ({
	getSchema: always(req.mysqlx),
	getCollection: <T extends TableNames>(name: T) =>
		req.mysqlx.getCollection<TableDataType<T>>(name),
});

export const requestlessMySQLBackend = (schema: mysql.Schema): RawMySQLBackend => ({
	getSchema: always(schema),
	getCollection: <T extends TableNames>(name: T) => schema.getCollection<TableDataType<T>>(name),
});
