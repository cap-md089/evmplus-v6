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

import { errorGenerator, ServerError } from '../typings/api';
import { Identifiable } from '../typings/types';
import { AsyncEither, asyncEither, asyncRight } from './AsyncEither';
import { Either, EitherObj } from './Either';
import { alwaysFalse, identity } from './Util';

export function* iterFromArray<T>(array: T[]): Iter<T> {
	for (const i of array) {
		yield i;
	}
}

export function iterToArray<T>(iter: Iter<T>): T[] {
	const result: T[] = [];

	for (const i of iter) {
		result.push(i);
	}

	return result;
}

export const iterMap = <T, U>(map: (v: T) => U) =>
	function* (iter: Iter<T>): Iter<U> {
		for (const i of iter) {
			yield map(i);
		}
	};

export type Iter<T> = Iterable<T> | IterableIterator<T> | Generator<T, any, any> | T[];
export type AsyncIter<T> =
	| Iter<T>
	| AsyncGenerator<T, any, any>
	| AsyncIterableIterator<T>
	| AsyncIterable<T>;

export function iterFilter<T>(filter: (v: T) => boolean): (iter: Iter<T>) => IterableIterator<T>;
export function iterFilter<T, S extends T>(
	filter: (v: T) => v is S,
): (iter: Iter<T>) => IterableIterator<S>;

export function iterFilter<T>(filter: (v: T) => boolean) {
	return function* (iter: Iter<T>): Iter<T> {
		for (const i of iter) {
			if (filter(i)) {
				yield i;
			}
		}
	};
}

export const iterReduce = <T, U>(reducer: (prev: U, curr: T) => U) => (initialValue: U) => (
	iter: Iter<T>,
): U => {
	let value = initialValue;

	for (const i of iter) {
		value = reducer(value, i);
	}

	return value;
};

export function iterFind<T, S extends T>(
	predicate: (v: T) => v is S,
): (iter: Iter<T>) => S | undefined;
export function iterFind<T>(predicate: (v: T) => boolean): (iter: Iter<T>) => T | undefined;

export function iterFind<T>(predicate: (v: T) => boolean) {
	return (iter: IterableIterator<T> | T[]): T | undefined => {
		for (const i of iter) {
			if (predicate(i)) {
				return i;
			}
		}
	};
}

export const iterIncludes = <T>(value: T) => (iter: Iter<T>): boolean => {
	for (const i of iter) {
		if (value === i) {
			return true;
		}
	}

	return false;
};

export const iterConcat = <T>(iter1: Iter<T>) =>
	function* (iter2: Iter<T>): Iter<T> {
		for (const item of iter1) {
			yield item;
		}

		for (const item of iter2) {
			yield item;
		}
	};

export const filterUnique = function* <T extends Identifiable | number | string>(
	iter: Iter<T>,
): Iter<T> {
	const found: { [key: string]: boolean } = {};

	for (const item of iter) {
		if ('id' in item) {
			const item2 = item as Identifiable;
			if (!found[item2.id]) {
				found[item2.id] = true;
				yield item;
			}
		} else {
			if (!found[item.toString()]) {
				found[item.toString()] = true;
				yield item;
			}
		}
	}
};

export const iterCollect = <T>(iter1: Iter<T>): T[] => {
	const results = [];
	for (const i of iter1) {
		results.push(i);
	}
	return results;
}

export async function* toAsyncIterableIterator<T>(iter: AsyncIter<T>): AsyncIterableIterator<T> {
	for await (const i of iter) {
		yield i;
	}
}

export const asyncIterHandler = <T>(errorHandler: (err: Error) => ServerError) =>
	async function* (iter: AsyncIterableIterator<T>): AsyncIter<EitherObj<ServerError, T>> {
		const errorIter: AsyncIterator<EitherObj<ServerError, T>> = {
			async next(...args: [] | [undefined]) {
				try {
					const result = await iter.next(...args);

					if (result.done) {
						return { done: true, value: Either.right(result.value) };
					}

					return { done: false, value: Either.right(result.value) };
				} catch (e) {
					return { done: false, value: Either.left(errorHandler(e)) };
				}
			},
		};

		for await (const i of { [Symbol.asyncIterator]: () => errorIter }) {
			yield i;
		}
	};

export const asyncEitherIterMap = <T, U>(map: (v: T) => U | PromiseLike<U>) =>
	async function* (
		iter: AsyncIter<EitherObj<ServerError, T>>,
	): AsyncIterableIterator<EitherObj<ServerError, U>> {
		for await (const i of iter) {
			if (i.direction === 'left') {
				yield i;
			} else {
				yield Either.right(await map(i.value));
			}
		}
	};

export const asyncEitherIterFlatMap = <T, U>(map: (v: T) => AsyncEither<ServerError, U>) =>
	async function* (
		iter: AsyncIter<EitherObj<ServerError, T>>,
	): AsyncIterableIterator<EitherObj<ServerError, U>> {
		for await (const i of iter) {
			if (i.direction === 'left') {
				yield i;
			} else {
				yield asyncEither(i, errorGenerator('Wat')).flatMap(map);
			}
		}
	};

export const asyncIterMap = <T, U>(map: (v: T) => U | PromiseLike<U>) =>
	async function* (iter: AsyncIter<T>): AsyncIterableIterator<U> {
		for await (const i of iter) {
			yield map(i);
		}
	};

export const asyncIterStatefulMap = <S>(initialState: S) => <T, U>(
	map: (
		value: T,
		state: S,
	) => [S, U | PromiseLike<U>] | PromiseLike<[S, U]> | AsyncEither<ServerError, [S, U]>,
) => (iter: AsyncIter<T>): [Promise<S>, AsyncIterableIterator<U>] => {
	let res: ((state: S) => void) | undefined;
	let rej: ((err: Error) => void) | undefined;

	return [
		new Promise<S>((resolve, reject) => {
			res = resolve;
			rej = reject;
		}),
		(async function* () {
			let state = typeof initialState === 'object' ? { ...initialState } : initialState;
			let yieldValue;

			try {
				for await (const i of iter) {
					const mapObj = map(i, state);

					if (mapObj instanceof AsyncEither) {
						[state, yieldValue] = await mapObj.fullJoin();
					} else {
						[state, yieldValue] = await mapObj;
					}

					yield yieldValue;
				}
			} catch (e) {
				rej?.(e);
			}

			res?.(state);
		})(),
	];
};

export const asyncIterFlatMap = <T, U>(map: (v: T) => U | PromiseLike<U>) =>
	async function* (iter: AsyncIter<AsyncIter<T>>): AsyncIterableIterator<U> {
		for await (const i of iter) {
			for await (const j of i) {
				yield map(j);
			}
		}
	};

export function asyncIterFilter<T>(
	filter: (v: T) => boolean | PromiseLike<boolean>,
): (iter: AsyncIter<T>) => AsyncIterableIterator<T>;
export function asyncIterFilter<T, S extends T>(
	filter: (v: T) => v is S,
): (iter: AsyncIter<T>) => AsyncIterableIterator<S>;

export function asyncIterFilter<T>(filter: (v: T) => boolean | PromiseLike<boolean>) {
	return async function* (iter: AsyncIter<T>): AsyncIterableIterator<T> {
		for await (const i of iter) {
			if (await filter(i)) {
				yield i;
			}
		}
	};
}

export const asyncIterRaiseEither = <L, T>(errorValue: L | ((err: Error) => L)) => (
	iter: AsyncIter<EitherObj<L, T>>,
): AsyncEither<L, T[]> => {
	const internal = async (): Promise<EitherObj<L, T[]>> => {
		const results: T[] = [];

		for await (const i of iter) {
			if (Either.isLeft(i)) {
				return i;
			}

			results.push(i.value);
		}

		return Either.right(results);
	};

	return asyncRight(internal(), errorValue).flatMap(identity);
};

export function asyncIterEitherFilter<T>(filter: (v: T) => AsyncEither<any, boolean>) {
	return async function* (iter: AsyncIter<T>): AsyncIterableIterator<T> {
		for await (const i of iter) {
			const res = filter(i).fullJoin().then(identity, alwaysFalse);
			if (await res) {
				yield i;
			}
		}
	};
}

export const asyncIterReduce = <T, U>(reducer: (prev: U, curr: T) => U | PromiseLike<U>) => (
	initialValue: U,
) => async (iter: AsyncIter<T>): Promise<U> => {
	let value = initialValue;

	for await (const i of iter) {
		value = await reducer(value, i);
	}

	return value;
};

export const asyncIterAny = <T>(predicate: (item: T) => boolean) => async (
	items: AsyncIter<T>,
): Promise<boolean> => {
	for await (const item of items) {
		if (predicate(item)) {
			return true;
		}
	}

	return false;
};

export const asyncIterTap = <T>(tapfunction: (value: T) => void | Promise<void>) =>
	async function* (iter: AsyncIter<T>): AsyncIter<T> {
		for await (const i of iter) {
			await tapfunction(i);
			yield i;
		}
	};

export const asyncIterConcat = <T>(iter1: AsyncIter<T>) =>
	async function* (iter2: () => AsyncIter<T>): AsyncIter<T> {
		for await (const item of iter1) {
			yield item;
		}

		for await (const item of iter2()) {
			yield item;
		}
	};

export const asyncIterConcat2 = async function* <T>(...iters: Array<AsyncIter<T>>): AsyncIter<T> {
	for (const iter of iters) {
		for await (const item of iter) {
			yield item;
		}
	}
};

export const asyncFilterUnique = async function* <T extends Identifiable | number | string>(
	iter: AsyncIter<T>,
): AsyncIter<T> {
	const found: { [key: string]: boolean } = {};

	for await (const item of iter) {
		if (typeof item === 'string' || typeof item === 'number') {
			if (!found[item.toString()]) {
				found[item.toString()] = true;
				yield item;
			}
		} else {
			if (!(item.id in found)) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				found[item.id] = true;
				yield item;
			}
		}
	}
};

export const yieldObj = function* <T>(item: T): IterableIterator<T> {
	yield item;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const yieldObjAsync = async function* <T>(
	item: T | PromiseLike<T>,
): AsyncIterableIterator<T> {
	yield item;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const yieldAsyncEither = async function* <T>(
	item: AsyncEither<ServerError, T>,
): AsyncIterableIterator<EitherObj<ServerError, T>> {
	yield item;
};

export const yieldEmpty = async function* <T>(): AsyncIterableIterator<T> {
	// does nothing
};

// Useful when combined with reduce to count items
export const addOne = (i: number): number => i + 1;
export const ZERO = 0;

export const countAsync = asyncIterReduce(addOne)(ZERO);
export const count = iterReduce(addOne)(ZERO);

export const maxAsync = asyncIterReduce(Math.max)(Number.NEGATIVE_INFINITY);
export const max = iterReduce(Math.max)(Number.NEGATIVE_INFINITY);

export const minAsync = asyncIterReduce(Math.min)(Number.POSITIVE_INFINITY);
export const min = iterReduce(Math.min)(Number.POSITIVE_INFINITY);

export const statefulFunction = <S>(initialState: S) => <T, U>(
	func: (val: T, state: S) => [U, S],
): ((val: T) => U) => {
	let state = initialState;
	let returnValue;

	return (val: T) => {
		[returnValue, state] = func(val, state);

		return returnValue;
	};
};
