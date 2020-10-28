/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org. It provides utility types for doing
 * type level magic
 *
 * For example, take a tuple and get a unary type of all the elements in
 * tuple:
 *
 * ```ts
 * 	type OrList<TL extends TypeList<any, any>, Current = never> = {
 * 		'recurse': Current | TL['head'] | OrList<TL['tail'], Current>,
 * 		'base': Current | TL['head']
 * 	}[TL extends TypeList<any, null> ? 'base' : 'recurse'];
 *
 * 	type StringsOrNumbers = OrList<TupleToList<[number, string]>>;
 *
 * 	const a: StringsOrNumbers = 2;
 * 	const b: StringsOrNumbers = 'string';
 *
 * 	// This will fail, as `never[]` is not assignable to `string | number`
 * 	// @ts-expect-error
 * 	const c: StringsOrNumbers = [];
 * ```
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
 * Represents a linked list of types
 */
export interface TypeList<HeadItem, TailItem extends TypeList<any, any> | null> {
	head: HeadItem;
	tail: TailItem;
}

/**
 * Gets the first item in the type list
 */
export type Head<T extends TypeList<any, any>> = T extends TypeList<infer HeadItem, any>
	? HeadItem
	: never;

/**
 * Gets the remaining items in the type list
 */
export type Tail<T extends TypeList<any, any>> = T extends TypeList<any, infer TailItem>
	? TailItem
	: never;

/**
 * Gets the last item in the type list
 */
export type Last<T extends TypeList<any, any>> = {
	recurse: Last<Tail<T>>;
	base: Head<T>;
}[Tail<T> extends null ? 'base' : 'recurse'];

/**
 * Converts a tuple to type list
 */
export type TupleToTypeList<Tuple extends readonly any[]> = {
	// @ts-ignore
	recurse: ((...args: Tuple) => any) extends (head: infer U, ...tail: infer V) => any
		? TypeList<U, TupleToTypeList<[...V]>>
		: null;
	base: null;
}[Tuple extends [] ? 'base' : 'recurse'];

/**
 * Converts a full type list to a tuple
 */
export type TypeListToTuple<InputList extends TypeList<any, any>, Tuple extends any[] = []> = {
	recurse: TypeListToTuple<Tail<InputList>, [...Tuple, Head<InputList>]>;
	base: [...Tuple, Head<InputList>];
}[InputList['tail'] extends null ? 'base' : 'recurse'];

/**
 * Used to take all the elements in a tuple list and form a union with them
 */
export type OrList<TL extends TypeList<any, any>> = {
	recurse: TL['head'] | OrList<TL['tail']>;
	base: TL['head'];
}[TL extends TypeList<any, null> ? 'base' : 'recurse'];
