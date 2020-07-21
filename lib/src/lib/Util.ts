/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Either, EitherObj } from './Either';

export const destroy = () => void 0;

export const call = <U extends any[], V>(...args: U) => (f: (...args: U) => V) => f(...args);

export const ofLength = (length: number) => (lengthy: { length: number }) =>
	lengthy.length === length;

export const get = <T, K extends keyof T>(prop: K) => (obj: T): T[K] => obj[prop];

export const set = <T, K extends keyof T>(prop: K) => (value: T[K]) => (obj: T): T => ({
	...obj,
	[prop]: value,
});

type KeysThatAreFunctions<T, K extends keyof T = keyof T> = T[K] extends (...args: any[]) => any
	? K
	: never;

export const execute = <T, K extends KeysThatAreFunctions<T>, F extends any[]>(
	prop: T[K] extends (...args: F) => any ? K : never,
	...args: F
) => (obj: T): T[K] extends (...args: F) => infer V ? V : never => obj[prop](...args);

export const identity = <T>(v: T): T => v;

export const give = <T>(v: T) => (): T => v;

export const stripProp = <T extends object, K extends string = Extract<keyof T, string>>(
	prop: K
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

export const collectGeneratorAsync = async <T>(gen: AsyncIterableIterator<T>): Promise<T[]> => {
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

export const always = <T>(value: T) => () => value;

export const complement = <T extends any[]>(
	func: (...args: T) => boolean
): ((...args: T) => boolean) => (...args) => !func(...args);

export const getItemsNotInSecondArray = <T>(
	equalityCheckFunction: (item1: T) => (item2: T) => boolean
) => (list1: T[]) => (list2: T[]) => list1.filter(item => !list2.some(equalityCheckFunction(item)));

export const memoize = <Return, Arg extends any>(func: (arg: Arg) => Return) => {
	const returns = new Map<Arg, Return>();

	return (arg: Arg): Return => {
		if (!returns.has(arg)) {
			returns.set(arg, func(arg));
		}

		return returns.get(arg)!;
	};
};

export const onlyRights = <T>(arr: Array<EitherObj<any, T>>): T[] =>
	arr.filter(Either.isRight).map(get('value'));

export const hasErrors = (arr: Array<EitherObj<any, any>>): boolean => arr.some(Either.isLeft);
