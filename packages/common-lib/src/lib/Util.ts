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

import { Either, EitherObj } from './Either';
import { AsyncIter } from './iter';

export const destroy = (): undefined => void 0;

export const call = <U extends any[], V>(...args: U) => (f: (...funcArgs: U) => V): V => f(...args);

export const ofLength = (length: number) => (lengthy: { length: number }): boolean =>
	lengthy.length === length;

export const get = <T, K extends keyof T>(prop: K) => (obj: T): T[K] => obj[prop];

export const set = <T, K extends keyof T>(prop: K) => (value: T[K]) => (obj: T): T => ({
	...obj,
	[prop]: value,
});

export const identity = <T>(v: T): T => v;

export const give = <T>(v: T) => (): T => v;

export const stripProp = <T extends object, K extends string = Extract<keyof T, string>>(
	prop: K,
) => (obj: T): Omit<T, K> => {
	const result = {} as T;

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			if ((key as any) !== prop) {
				result[key] = obj[key];
			}
		}
	}

	return result;
};

export const collectGenerator = <T>(gen: IterableIterator<T> | T[]): T[] => {
	if (gen instanceof Array) {
		return gen;
	}

	const ret: T[] = [];

	for (const i of gen) {
		ret.push(i);
	}

	return ret;
};

export const collectGeneratorAsync = async <T>(gen: AsyncIter<T>): Promise<T[]> => {
	const ret: T[] = [];

	for await (const i of gen) {
		ret.push(i);
	}

	return ret;
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

export const always = <T>(value: T) => (): T => value;
export const alwaysTrue = always(true);
export const alwaysFalse = always(false);

export const complement = <T extends any[]>(
	func: (...args: T) => boolean,
): ((...args: T) => boolean) => (...args) => !func(...args);

export const getItemsNotInSecondArray = <T>(
	equalityCheckFunction: (item1: T) => (item2: T) => boolean,
) => (list1: T[]) => (list2: T[]): T[] =>
	list1.filter(item => !list2.some(equalityCheckFunction(item)));

export const memoize = <Return, Arg extends any>(
	func: (arg: Arg) => Return,
	serialize?: (arg: Arg) => string | number,
): ((arg: Arg) => Return) => {
	const returns = new Map<Arg | string | number, Return>();

	return (arg: Arg): Return => {
		if (serialize) {
			let value = returns.get(serialize(arg));

			if (!value) {
				value = func(arg);
				returns.set(serialize(arg), value);
			}

			return value;
		} else {
			let value = returns.get(arg);

			if (!value) {
				value = func(arg);
				returns.set(arg, value);
			}

			return value;
		}
	};
};

export const onlyRights = <T>(arr: Array<EitherObj<any, T>>): T[] =>
	arr.filter(Either.isRight).map(get('value'));

export const hasErrors = (arr: Array<EitherObj<any, any>>): boolean => arr.some(Either.isLeft);

export const isNotUndefined = <T>(value: T | undefined | null): value is T => !!value;

export type ZippedArrays<T extends readonly any[], U extends readonly any[]> = T extends [
	infer F1,
	...infer R1
]
	? U extends [infer F2, ...infer R2]
		? [[F1, F2], ...ZippedArrays<R1, R2>]
		: []
	: [];

export const zip = <T extends readonly any[], U extends readonly any[]>(
	arr1: T,
	arr2: U,
): ZippedArrays<T, U> =>
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	arr1.map((v1, i) => [v1, arr2[i]]) as ZippedArrays<T, U>;
