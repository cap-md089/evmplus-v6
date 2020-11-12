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

/**
 * Small utility function to memoize a binary function
 *
 * Internally, this function uses a map. As such, it can grow if given enough time
 *
 * @param func the function to memoize
 */
export const binaryMapMemoize = <A1, A2, R>(
	func: (arg1: A1, arg2: A2) => R,
): ((arg1: A1, arg2: A2) => R) => {
	const cache = new Map<A2, Map<A1, R>>();

	return (arg1, arg2) => {
		const result = cache.get(arg2)?.get(arg1);
		if (result !== undefined) {
			return result;
		}

		let subCache;
		if (cache.has(arg2)) {
			subCache = cache.get(arg2)!;
		} else {
			subCache = new Map<A1, R>();
			cache.set(arg2, subCache);
		}

		const functionReturn = func(arg1, arg2);

		subCache.set(arg1, functionReturn);

		return functionReturn;
	};
};

/**
 * Small utility function to memoize a binary function
 *
 * This function only stores one result in its history
 *
 * @param func the function to memoize
 */
export const binaryMemoize = <A1, A2, R>(
	func: (arg1: A1, arg2: A2) => R,
): ((arg1: A1, arg2: A2) => R) => {
	let previousResult: { arg1: A1; arg2: A2; result: R } | undefined;

	return (arg1, arg2) => {
		if (arg2 === previousResult?.arg2 && arg1 === previousResult?.arg1) {
			return previousResult.result;
		}

		const result = func(arg1, arg2);

		previousResult = {
			arg1,
			arg2,
			result,
		};

		return result;
	};
};

export default binaryMemoize;
