/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

export type EitherObj<L, R> = Left<L> | Right<R>;

export interface Left<L> {
	direction: 'left';

	value: L;
}

export interface Right<R> {
	direction: 'right';

	value: R;
}

export class Either {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static left = <L, _R>(value: L): Left<L> => ({ direction: 'left', value });

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static right = <_L, R>(value: R): Right<R> => ({ direction: 'right', value });

	public static isLeft = <L, R>(v: EitherObj<L, R>): v is Left<L> => v.direction === 'left';

	public static isRight = <L, R>(v: EitherObj<L, R>): v is Right<R> => v.direction === 'right';

	public static leftMap = <L, L2, R>(f: (val: L) => L2) => (
		eith: EitherObj<L, R>,
	): EitherObj<L2, R> => (Either.isLeft(eith) ? Either.left(f(eith.value)) : eith);

	public static map = <L, R, R2>(f: (val: R) => R2) => (
		eith: EitherObj<L, R>,
	): EitherObj<L, R2> => (Either.isRight(eith) ? Either.right(f(eith.value)) : eith);

	public static flatMap = <L, R, R2>(f: (val: R) => EitherObj<L, R2>) => (
		eith: EitherObj<L, R>,
	): EitherObj<L, R2> => (Either.isRight(eith) ? f(eith.value) : eith);

	public static cata = <L, R, T>(lf: (v: L) => T) => (rf: (v: R) => T) => (
		eith: EitherObj<L, R>,
	): T => (Either.isRight(eith) ? rf(eith.value) : lf(eith.value));

	public static filter = <L, R>(predicate: (val: R) => boolean) => (
		filterError: L,
	): ((obj: EitherObj<L, R>) => EitherObj<L, R>) =>
		Either.cata<L, R, EitherObj<L, R>>(Either.left)(right =>
			predicate(right) ? Either.right(right) : Either.left(filterError),
		);

	public static filterType = <L, R, S extends R>(predicate: (val: R) => val is S) => (
		filterError: L,
	): ((obj: EitherObj<L, R>) => EitherObj<L, S>) =>
		Either.cata<L, R, EitherObj<L, S>>(Either.left)(right =>
			predicate(right) ? Either.right(right) : Either.left(filterError),
		);

	public static isValidEither = (obj: unknown): obj is EitherObj<unknown, unknown> =>
		typeof obj === 'object' &&
		obj !== null &&
		'direction' in obj &&
		typeof (obj as { direction: unknown }).direction === 'string' &&
		((obj as { direction: string }).direction === ('Left' as Left<any>['direction']) ||
			(obj as { direction: string }).direction === ('Right' as Right<any>['direction'])) &&
		'value' in obj &&
		(obj as { direction: unknown }).direction !== undefined;
}
