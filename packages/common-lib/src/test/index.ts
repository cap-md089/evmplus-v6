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

import { always } from 'ramda';
import { Either, EitherObj, Maybe, MaybeObj } from '..';
import { Left, Right } from '../lib/Either';
import { None, Some } from '../lib/Maybe';

export * from './data';
export {};
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Matchers<R> {
			toBeRight(): R;

			toEqualRight(value: any): R;

			toMatchRight(value: any): R;

			toBeLeft(): R;

			toEqualLeft(value: any): R;

			toMatchLeft(value: any): R;

			toBeSome(): R;

			toEqualSome(value: any): R;

			toMatchSome(value: any): R;

			toBeNone(): R;
		}
	}
}

const isValidEitherObj = (obj: unknown): obj is EitherObj<unknown, unknown> =>
	typeof obj === 'object' &&
	obj !== null &&
	'direction' in obj &&
	typeof (obj as { direction: unknown }).direction === 'string' &&
	((obj as { direction: string }).direction === ('Left' as Left<any>['direction']) ||
		(obj as { direction: string }).direction === ('Right' as Right<any>['direction'])) &&
	'value' in obj &&
	(obj as { direction: unknown }).direction !== undefined;

const isValidMaybeObj = (obj: unknown): obj is MaybeObj<unknown> =>
	typeof obj === 'object' &&
	obj !== null &&
	'hasValue' in obj &&
	typeof (obj as { hasValue: unknown }).hasValue === 'boolean' &&
	(!(obj as None).hasValue || (obj as Some<unknown>).value !== undefined);

const emptyMessage = always('');

expect.extend({
	toBeRight(received) {
		if (!isValidEitherObj(received)) {
			return {
				message: always('Value received is not a valid EitherObj'),
				pass: false,
			};
		}

		return {
			message: always(
				`Value received is ${this.isNot ? 'right' : 'left'}: ${JSON.stringify(
					received.value,
				)}`,
			),
			pass: this.isNot ? received.direction === 'left' : received.direction === 'right',
		};
	},
	toEqualRight(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message: always('Value received is not a valid EitherObj'),
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'right') {
			return {
				message: always(`Value is right: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'left') {
			return {
				message: always(`Value is left: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		}

		if (this.isNot) {
			expect(received).not.toEqual(Either.right(value));
		} else {
			expect(received).toEqual(Either.right(value));
		}

		// This point is reached when the above assertion was successful.
		// The test should therefore always pass, that means it needs to be
		// `true` when used normally, and `false` when `.not` was used.
		return {
			pass: !this.isNot,
			message: emptyMessage,
		};
	},
	toMatchRight(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message: always('Value received is not a valid EitherObj'),
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'right') {
			return {
				message: always(`Value is right: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'left') {
			return {
				message: always(`Value is left: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		}

		if (this.isNot) {
			expect(received).not.toMatchObject(Either.right(value));
		} else {
			expect(received).toMatchObject(Either.right(value));
		}

		// This point is reached when the above assertion was successful.
		// The test should therefore always pass, that means it needs to be
		// `true` when used normally, and `false` when `.not` was used.
		return {
			pass: !this.isNot,
			message: emptyMessage,
		};
	},
	toBeLeft(received) {
		if (!isValidEitherObj(received)) {
			return {
				message: always('Value received is not a valid EitherObj'),
				pass: false,
			};
		}

		return {
			message: always(
				`Value received is ${this.isNot ? 'left' : 'right'}: ${JSON.stringify(
					received.value,
				)}`,
			),
			pass: this.isNot ? received.direction === 'right' : received.direction === 'left',
		};
	},
	toEqualLeft(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message: always('Value received is not a valid EitherObj'),
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'right') {
			return {
				message: always(`Value is right: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'left') {
			return {
				message: always(`Value is left: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		}

		if (this.isNot) {
			expect(received).not.toEqual(Either.left(value));
		} else {
			expect(received).toEqual(Either.left(value));
		}

		// This point is reached when the above assertion was successful.
		// The test should therefore always pass, that means it needs to be
		// `true` when used normally, and `false` when `.not` was used.
		return {
			pass: !this.isNot,
			message: emptyMessage,
		};
	},
	toMatchLeft(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message: always('Value received is not a valid EitherObj'),
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'left') {
			return {
				message: always(`Value is left: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'right') {
			return {
				message: always(`Value is right: ${JSON.stringify(received.value)}`),
				pass: false,
			};
		}

		if (this.isNot) {
			expect(received).not.toMatchObject(Either.left(value));
		} else {
			expect(received).toMatchObject(Either.left(value));
		}

		// This point is reached when the above assertion was successful.
		// The test should therefore always pass, that means it needs to be
		// `true` when used normally, and `false` when `.not` was used.
		return {
			pass: !this.isNot,
			message: emptyMessage,
		};
	},
	toBeSome(received) {
		if (!isValidMaybeObj(received)) {
			return {
				message: always('Value received is not a valid MaybeObj'),
				pass: false,
			};
		}

		return {
			message: always(`Value does ${this.isNot ? '' : 'not '}have a value`),
			pass: this.isNot ? received.hasValue : !received.hasValue,
		};
	},
	toEqualSome(received, value: any) {
		if (!isValidMaybeObj(received)) {
			return {
				message: always('Value received is not a valid MaybeObj'),
				pass: false,
			};
		}

		if (this.isNot && received.hasValue) {
			return {
				message: always(`Maybe object has value, expected none`),
				pass: false,
			};
		} else if (!this.isNot && !received.hasValue) {
			return {
				message: always(`Maybe object is none, expected some`),
				pass: false,
			};
		}

		if (this.isNot) {
			expect(received).not.toEqual(Maybe.some(value));
		} else {
			expect(received).toEqual(Maybe.some(value));
		}

		// This point is reached when the above assertion was successful.
		// The test should therefore always pass, that means it needs to be
		// `true` when used normally, and `false` when `.not` was used.
		return {
			pass: !this.isNot,
			message: emptyMessage,
		};
	},
	toMatchSome(received, value: any) {
		if (!isValidMaybeObj(received)) {
			return {
				message: always('Value received is not a valid MaybeObj'),
				pass: false,
			};
		}

		if (this.isNot && received.hasValue) {
			return {
				message: always(`Maybe object has value, expected none`),
				pass: false,
			};
		} else if (!this.isNot && !received.hasValue) {
			return {
				message: always(`Maybe object is none, expected some`),
				pass: false,
			};
		}

		if (this.isNot) {
			expect(received).not.toMatchObject(Maybe.some(value));
		} else {
			expect(received).toMatchObject(Maybe.some(value));
		}

		// This point is reached when the above assertion was successful.
		// The test should therefore always pass, that means it needs to be
		// `true` when used normally, and `false` when `.not` was used.
		return {
			pass: !this.isNot,
			message: emptyMessage,
		};
	},
	toBeNone(received) {
		if (!isValidMaybeObj(received)) {
			return {
				message: always('Value received is not a valid MaybeObj'),
				pass: false,
			};
		}

		return {
			message: always(`Value does ${this.isNot ? 'not ' : ''}have a value`),
			pass: this.isNot ? !received.hasValue : received.hasValue,
		};
	},
});
