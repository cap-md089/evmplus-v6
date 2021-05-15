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

import { pipe } from 'ramda';

export type MaybeObj<T> = Some<T> | None;

export interface Some<T> {
	hasValue: true;

	value: T;
}

export interface None {
	hasValue: false;
}

export type SomeFromMaybe<T extends MaybeObj<any>> = T extends MaybeObj<infer V> ? Some<V> : never;

const noneObj: None = { hasValue: false };

export class Maybe {
	public static And<V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(
		values: [
			MaybeObj<V1>,
			MaybeObj<V2>,
			MaybeObj<V3>,
			MaybeObj<V4>,
			MaybeObj<V5>,
			MaybeObj<V6>,
			MaybeObj<V7>,
			MaybeObj<V8>,
			MaybeObj<V9>,
			MaybeObj<V10>,
		],
	): MaybeObj<[V1, V2, V3, V4, V5, V6, V7, V8, V9, V10]>;
	public static And<V1, V2, V3, V4, V5, V6, V7, V8, V9>(
		values: [
			MaybeObj<V1>,
			MaybeObj<V2>,
			MaybeObj<V3>,
			MaybeObj<V4>,
			MaybeObj<V5>,
			MaybeObj<V6>,
			MaybeObj<V7>,
			MaybeObj<V8>,
			MaybeObj<V9>,
		],
	): MaybeObj<[V1, V2, V3, V4, V5, V6, V7, V8, V9]>;
	public static And<V1, V2, V3, V4, V5, V6, V7, V8>(
		values: [
			MaybeObj<V1>,
			MaybeObj<V2>,
			MaybeObj<V3>,
			MaybeObj<V4>,
			MaybeObj<V5>,
			MaybeObj<V6>,
			MaybeObj<V7>,
			MaybeObj<V8>,
		],
	): MaybeObj<[V1, V2, V3, V4, V5, V6, V7, V8]>;
	public static And<V1, V2, V3, V4, V5, V6, V7>(
		values: [
			MaybeObj<V1>,
			MaybeObj<V2>,
			MaybeObj<V3>,
			MaybeObj<V4>,
			MaybeObj<V5>,
			MaybeObj<V6>,
			MaybeObj<V7>,
		],
	): MaybeObj<[V1, V2, V3, V4, V5, V6, V7]>;
	public static And<V1, V2, V3, V4, V5, V6>(
		values: [
			MaybeObj<V1>,
			MaybeObj<V2>,
			MaybeObj<V3>,
			MaybeObj<V4>,
			MaybeObj<V5>,
			MaybeObj<V6>,
		],
	): MaybeObj<[V1, V2, V3, V4, V5, V6]>;
	public static And<V1, V2, V3, V4, V5>(
		values: [MaybeObj<V1>, MaybeObj<V2>, MaybeObj<V3>, MaybeObj<V4>, MaybeObj<V5>],
	): MaybeObj<[V1, V2, V3, V4, V5]>;
	public static And<V1, V2, V3, V4>(
		values: [MaybeObj<V1>, MaybeObj<V2>, MaybeObj<V3>, MaybeObj<V4>],
	): MaybeObj<[V1, V2, V3, V4]>;
	public static And<V1, V2, V3>(
		values: [MaybeObj<V1>, MaybeObj<V2>, MaybeObj<V3>],
	): MaybeObj<[V1, V2, V3]>;
	public static And<V1, V2>(values: [MaybeObj<V1>, MaybeObj<V2>]): MaybeObj<[V1, V2]>;
	public static And<V>(values: [MaybeObj<V>]): MaybeObj<[V]>;
	public static And<V>(values: Array<MaybeObj<V>>): MaybeObj<V[]>;

	public static And(values: Array<MaybeObj<any>>): MaybeObj<any[]> {
		const returnValue = [];

		for (const i of values) {
			if (!i.hasValue) {
				return Maybe.none();
			}

			returnValue.push(i.value);
		}

		return Maybe.some(returnValue);
	}

	public static isSome = <T>(m: MaybeObj<T>): m is Some<T> => m.hasValue;

	public static isNone = <T>(m: MaybeObj<T>): m is None => !m.hasValue;

	public static map = <T, U>(f: (v: T) => U) => (m: MaybeObj<T>): MaybeObj<U> =>
		m.hasValue ? Maybe.some(f(m.value)) : m;

	public static orElse = <T>(defaultValue: T) => (m: MaybeObj<T>): MaybeObj<T> =>
		m.hasValue ? m : Maybe.some(defaultValue);

	public static flatMap = <T, U>(f: (v: T) => MaybeObj<U>) => (m: MaybeObj<T>): MaybeObj<U> =>
		m.hasValue ? f(m.value) : m;

	public static join = <T>(m: MaybeObj<T>): T | null => (m.hasValue ? m.value : null);

	public static filter = <T>(f: (v: T) => boolean) => (m: MaybeObj<T>): MaybeObj<T> =>
		m.hasValue && f(m.value) ? m : noneObj;

	public static filterType = <T, U extends T = T>(f: (v: T) => v is U) => (
		m: MaybeObj<T>,
	): MaybeObj<U> => Maybe.filter(f)(m) as MaybeObj<U>;

	public static cata = <T, U>(nf: () => U) => (f: (v: T) => U) => (m: MaybeObj<T>) =>
		m.hasValue ? f(m.value) : nf();

	public static chain = <T, U>(f: (v: T) => U) => (m: MaybeObj<T>) => Maybe.join(Maybe.map(f)(m));

	public static orSome = <T>(val: T) => (m: MaybeObj<T>) =>
		pipe(Maybe.orElse(val), v => (v as Some<T>).value)(m);

	public static some = <T>(value: T): MaybeObj<T> => {
		return { hasValue: true, value };
	};

	public static none = (): None => noneObj;

	public static fromValue = <T>(value?: T | undefined | null): MaybeObj<T> =>
		value === undefined || value === null ? noneObj : Maybe.some(value);

	public static fromArray = <T>(array: T[]): MaybeObj<T> =>
		array.length === 1 ? Maybe.some(array[0]) : Maybe.none();

	public static toArray = <T>(maybe: MaybeObj<T>): T[] =>
		Maybe.isSome(maybe) ? [maybe.value] : [];
}
