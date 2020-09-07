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

import { Either, EitherObj, Maybe, MaybeObj } from '..';

export {};
declare global {
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

const isValidEitherObj = (obj: any): obj is EitherObj<any, any> =>
	typeof obj === 'object' &&
	obj !== null &&
	typeof obj.direction === 'string' &&
	obj.value !== undefined;

const isValidMaybeObj = (obj: any): obj is MaybeObj<any> =>
	typeof obj === 'object' &&
	obj !== null &&
	typeof obj.hasValue === 'boolean' &&
	(!obj.hasValue || obj.value !== undefined);

expect.extend({
	toBeRight(received) {
		if (!isValidEitherObj(received)) {
			return {
				message() {
					return 'Value received is not a valid EitherObj';
				},
				pass: false,
			};
		}

		return {
			message: () => {
				return `Value received is ${this.isNot ? 'right' : 'left'}: ${JSON.stringify(
					received.value,
				)}`;
			},
			pass: this.isNot ? received.direction === 'left' : received.direction === 'right',
		};
	},
	// @ts-ignore
	toEqualRight(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message() {
					return 'Value received is not a valid EitherObj';
				},
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'right') {
			return {
				message() {
					return `Value is right: ${JSON.stringify(received.value)}`;
				},
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'left') {
			return {
				message() {
					return `Value is left: ${JSON.stringify(received.value)}`;
				},
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
		};
	},
	// @ts-ignore
	toMatchRight(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message() {
					return 'Value received is not a valid EitherObj';
				},
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'right') {
			return {
				message() {
					return `Value is right: ${JSON.stringify(received.value)}`;
				},
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'left') {
			return {
				message() {
					return `Value is left: ${JSON.stringify(received.value)}`;
				},
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
		};
	},
	toBeLeft(received) {
		if (!isValidEitherObj(received)) {
			return {
				message() {
					return 'Value received is not a valid EitherObj';
				},
				pass: false,
			};
		}

		return {
			message: () => {
				return `Value received is ${this.isNot ? 'left' : 'right'}: ${JSON.stringify(
					received.value,
				)}`;
			},
			pass: this.isNot ? received.direction === 'right' : received.direction === 'left',
		};
	},
	// @ts-ignore
	toEqualLeft(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message() {
					return 'Value received is not a valid EitherObj';
				},
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'right') {
			return {
				message() {
					return `Value is right: ${JSON.stringify(received.value)}`;
				},
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'left') {
			return {
				message() {
					return `Value is left: ${JSON.stringify(received.value)}`;
				},
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
		};
	},
	// @ts-ignore
	toMatchLeft(received, value: any) {
		if (!isValidEitherObj(received)) {
			return {
				message() {
					return 'Value received is not a valid EitherObj';
				},
				pass: false,
			};
		}

		if (this.isNot && received.direction === 'left') {
			return {
				message() {
					return `Value is left: ${JSON.stringify(received.value)}`;
				},
				pass: false,
			};
		} else if (!this.isNot && received.direction === 'right') {
			return {
				message() {
					return `Value is right: ${JSON.stringify(received.value)}`;
				},
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
		};
	},
	toBeSome(received) {
		if (!isValidMaybeObj(received)) {
			return {
				message() {
					return 'Value received is not a valid MaybeObj';
				},
				pass: false,
			};
		}

		return {
			message: () => {
				return `Value does ${this.isNot ? '' : 'not '}have a value`;
			},
			pass: this.isNot ? received.hasValue : !received.hasValue,
		};
	},
	// @ts-ignore
	toEqualSome(received, value: any) {
		if (!isValidMaybeObj(received)) {
			return {
				message() {
					return 'Value received is not a valid MaybeObj';
				},
				pass: false,
			};
		}

		if (this.isNot && received.hasValue) {
			return {
				message() {
					return `Maybe object has value, expected none`;
				},
				pass: false,
			};
		} else if (!this.isNot && !received.hasValue) {
			return {
				message() {
					return `Maybe object is none, expected some`;
				},
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
		};
	},
	// @ts-ignore
	toMatchSome(received, value: any) {
		if (!isValidMaybeObj(received)) {
			return {
				message() {
					return 'Value received is not a valid MaybeObj';
				},
				pass: false,
			};
		}

		if (this.isNot && received.hasValue) {
			return {
				message() {
					return `Maybe object has value, expected none`;
				},
				pass: false,
			};
		} else if (!this.isNot && !received.hasValue) {
			return {
				message() {
					return `Maybe object is none, expected some`;
				},
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
		};
	},
	toBeNone(received) {
		if (!isValidMaybeObj(received)) {
			return {
				message() {
					return 'Value received is not a valid MaybeObj';
				},
				pass: false,
			};
		}

		return {
			message: () => {
				return `Value does ${this.isNot ? 'not ' : ''}have a value`;
			},
			pass: this.isNot ? !received.hasValue : received.hasValue,
		};
	},
});
