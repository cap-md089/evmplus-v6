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

import { Either, EitherObj } from './Either';
import { call, get } from './Util';

export interface ValidatorImpl<T> {
	validate(obj: unknown, keyName: string): EitherObj<ValidatorFail, T>;
}

export interface ValidatorFailBase {
	keyName: string;

	correctType: string;

	message: string;

	valueReceived: any;
}

export interface ValidatorFailArray extends ValidatorFailBase {
	errors: ValidatorFail[];
}

export interface ValidatorFailMap extends ValidatorFailBase {
	errors: {
		[key: string]: ValidatorFail;
	};
}

export interface ValidatorFailObject<T> extends ValidatorFailBase {
	errors: {
		[key in keyof T]?: ValidatorFail;
	};
}

export type ValidatorFail =
	| ValidatorFailBase
	| ValidatorFailArray
	| ValidatorFailMap
	| ValidatorFailObject<any>;

type ValidatorFunction<T> = ValidatorImpl<T>; // (name: string, obj: unknown) => EitherObj<ValidatorFail, T>;
type ValidatorFunc<T> = ValidatorImpl<T>;

export type ValidateRuleSet<T> = { [P in keyof T]: ValidatorImpl<T[P]> };

const callValidator = <T>(func: ValidatorImpl<T>) => (keyName: string) => (
	input: unknown,
): EitherObj<ValidatorFail, T> => func.validate(input, keyName);

export default class Validator<T extends object> implements ValidatorImpl<T> {
	public static Null: ValidatorFunction<null> = {
		validate: (input, keyName) =>
			input === null
				? Either.right(input)
				: Either.left({
						keyName,
						correctType: 'null',
						message: `${keyName} must be null`,
						valueReceived: input,
				  }),
	};

	public static Anything: ValidatorFunction<any> = {
		validate: Either.right,
	};

	// eslint-disable-next-line id-blacklist
	public static Number: ValidatorFunction<number> = {
		validate: (input, keyName) =>
			typeof input === 'number'
				? Either.right(input)
				: Either.left({
						keyName,
						correctType: 'number',
						message: `${keyName} must be a number`,
						valueReceived: input,
				  }),
	};

	// eslint-disable-next-line id-blacklist
	public static String: ValidatorFunction<string> = {
		validate: (input, keyName) =>
			typeof input === 'string'
				? Either.right(input)
				: Either.left({
						keyName,
						correctType: 'string',
						message: `${keyName} must be a string`,
						valueReceived: input,
				  }),
	};

	// eslint-disable-next-line id-blacklist
	public static Boolean: ValidatorFunction<boolean> = {
		validate: (input, keyName) =>
			typeof input === 'boolean'
				? Either.right(input)
				: Either.left({
						keyName,
						correctType: 'boolean',
						message: `${keyName} must be a boolean`,
						valueReceived: input,
				  }),
	};

	public static Optional = <U>(func: ValidatorImpl<U>): ValidatorFunction<U | undefined> => ({
		validate: (input, keyName) =>
			input === undefined
				? Either.right<ValidatorFail, U | undefined>(undefined)
				: callValidator<U>(func)(keyName)(input),
	});

	public static Required = <U>(validators: ValidateRuleSet<U>): ValidatorImpl<Required<U>> => {
		const fields = ({} as unknown) as ValidateRuleSet<Required<U>>;

		for (const field in validators) {
			if (validators.hasOwnProperty(field)) {
				fields[field] = Validator.RequiredPropertyWrapper(validators[field]);
			}
		}

		return new Validator(fields);
	};

	public static Partial = <U>(validators: ValidateRuleSet<U>): ValidatorImpl<Partial<U>> => ({
		validate: (input, keyName) => {
			if (typeof input !== 'object' || input === null) {
				return Either.left({
					keyName,
					correctType: 'Partial<object>',
					message: `${keyName} is null or not an object`,
					valueReceived: input,
				});
			}

			const errors: ValidatorFailObject<U>['errors'] = {};
			const result: Partial<U> = {};

			let hasError = false,
				validator,
				validatorResult;

			for (const key in validators) {
				if (input.hasOwnProperty(key)) {
					validator = validators[key];

					validatorResult = validator.validate(input[key as keyof object], key);

					if (Either.isLeft(validatorResult)) {
						hasError = true;
						errors[key] = validatorResult.value;
					} else if (!hasError) {
						result[key] = validatorResult.value;
					}
				}
			}

			return hasError
				? Either.left({
						keyName,
						correctType: 'Partial<object>',
						message: `${keyName} has invalid properties`,
						valueReceived: input,
						errors,
				  })
				: Either.right(result);
		},
	});

	public static Enum = <E extends number>(
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		value: any,
		enumName: string,
	): ValidatorFunction<E> => ({
		validate: (input, keyName) =>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			typeof value[input as any] !== 'string'
				? Either.left({
						keyName,
						correctType: enumName,
						message: `${keyName} must be an element of the enum '${enumName}'`,
						valueReceived: input,
				  })
				: Either.right(input as E),
	});

	public static ArrayOf = <S>(validator: ValidatorFunc<S>): ValidatorFunction<S[]> => ({
		validate: (input, keyName) => {
			if (!Array.isArray(input)) {
				return Either.left({
					correctType: 'array',
					keyName,
					message: 'object must be an array',
					valueReceived: input,
				});
			}

			const results = input.map(callValidator(validator)(keyName));

			const goodResults = results.filter(Either.isRight).map(get('value'));

			return goodResults.length === results.length
				? Either.right(goodResults)
				: Either.left({
						correctType: 'array',
						errors: results.filter(Either.isLeft).map(get('value')),
						keyName,
						message: 'object must be an array with properly shaped elements',
						valueReceived: input,
				  });
		},
	});

	public static Or<S1>(correctType: string, validator1: ValidatorFunc<S1>): ValidatorFunction<S1>;
	public static Or<S1, S2>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
	): ValidatorFunction<S1 | S2>;
	public static Or<S1, S2, S3>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
	): ValidatorFunction<S1 | S2 | S3>;
	public static Or<S1, S2, S3, S4>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
	): ValidatorFunction<S1 | S2 | S3 | S4>;
	public static Or<S1, S2, S3, S4, S5>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5>;
	public static Or<S1, S2, S3, S4, S5, S6>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6>;
	public static Or<S1, S2, S3, S4, S5, S6, S7>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7>;
	public static Or<S1, S2, S3, S4, S5, S6, S7, S8>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S3>,
		validator5: ValidatorFunc<S4>,
		validator6: ValidatorFunc<S5>,
		validator7: ValidatorFunc<S6>,
		validator8: ValidatorFunc<S7>,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8>;
	public static Or<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
		validator8: ValidatorFunc<S8>,
		validator9: ValidatorFunc<S9>,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9>;
	public static Or<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
		validator8: ValidatorFunc<S8>,
		validator9: ValidatorFunc<S9>,
		validator10: ValidatorFunc<S10>,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10>;

	// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
	public static Or(
		correctType: string,
		...validators: Array<Validator<any> | ValidatorFunction<any>>
	): ValidatorFunction<any> {
		return {
			validate: (input, keyName) => {
				const results = validators.map(callValidator).map(call(keyName)).map(call(input));

				const errors = results.filter(Either.isLeft).map(get('value'));

				const whatsLeft = results.filter(Either.isRight).map(get('value'));

				return errors.length === validators.length - 1
					? Either.right(whatsLeft[0])
					: Either.left({
							correctType,
							message: 'Object did not match one of the required types',
							keyName,
							errors,
							valueReceived: input,
					  });
			},
		};
	}

	public static And<S1>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
	): ValidatorFunction<S1>;
	public static And<S1, S2>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
	): ValidatorFunction<S1 & S2>;
	public static And<S1, S2, S3>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
	): ValidatorFunction<S1 & S2 & S3>;
	public static And<S1, S2, S3, S4>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
	): ValidatorFunction<S1 & S2 & S3 & S4>;
	public static And<S1, S2, S3, S4, S5>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5>;
	public static And<S1, S2, S3, S4, S5, S6>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6>;
	public static And<S1, S2, S3, S4, S5, S6, S7>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7>;
	public static And<S1, S2, S3, S4, S5, S6, S7, S8>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
		validator8: ValidatorFunc<S8>,
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8>;
	public static And<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
		validator8: ValidatorFunc<S8>,
		validator9: ValidatorFunc<S9>,
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9>;
	public static And<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
		correctType: string,
		validator1: ValidatorFunc<S1>,
		validator2: ValidatorFunc<S2>,
		validator3: ValidatorFunc<S3>,
		validator4: ValidatorFunc<S4>,
		validator5: ValidatorFunc<S5>,
		validator6: ValidatorFunc<S6>,
		validator7: ValidatorFunc<S7>,
		validator8: ValidatorFunc<S8>,
		validator9: ValidatorFunc<S9>,
		validator10: ValidatorFunc<S10>,
	): ValidatorFunction<S1 & S2 & S3 & S4 & S5 & S6 & S7 & S8 & S9 & S10>;

	// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
	public static And(
		correctType: string,
		...validators: Array<Validator<any> | ValidatorFunction<any>>
	): ValidatorFunction<any> {
		return {
			validate: (input, keyName) => {
				const errors = validators
					.map(callValidator)
					.map(call(keyName))
					.map(call(input))
					.filter(Either.isLeft);

				return errors.length === 0
					? Either.right(input)
					: Either.left({
							correctType,
							keyName,
							message: 'Object did not match all the required types',
							errors,
							valueReceived: input,
					  });
			},
		};
	}

	public static StrictValue = <U>(value: U): ValidatorFunction<U> => ({
		validate: (input, keyName) =>
			input === value
				? Either.right(input as U)
				: Either.left({
						correctType: 'const',
						keyName,
						message: `Provided value did not match input value: ${input as string} vs ${
							(value as unknown) as string
						}`,
						valueReceived: input,
				  }),
	});

	public static OneOfStrict<S1>(correctType: string, validator1: S1): ValidatorFunction<S1>;
	public static OneOfStrict<S1, S2>(
		correctType: string,
		validator1: S1,
		validator2: S2,
	): ValidatorFunction<S1 | S2>;
	public static OneOfStrict<S1, S2, S3>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
	): ValidatorFunction<S1 | S2 | S3>;
	public static OneOfStrict<S1, S2, S3, S4>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
	): ValidatorFunction<S1 | S2 | S3 | S4>;
	public static OneOfStrict<S1, S2, S3, S4, S5>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7, S8>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
		validator8: S8,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7, S8, S9>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
		validator8: S8,
		validator9: S9,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9>;
	public static OneOfStrict<S1, S2, S3, S4, S5, S6, S7, S8, S9, S10>(
		correctType: string,
		validator1: S1,
		validator2: S2,
		validator3: S3,
		validator4: S4,
		validator5: S5,
		validator6: S6,
		validator7: S7,
		validator8: S8,
		validator9: S9,
		validator10: S10,
	): ValidatorFunction<S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10>;
	public static OneOfStrict<T extends any>(
		correctType: string,
		...values: T[]
	): ValidatorFunction<T>;

	// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
	public static OneOfStrict<U extends any[]>(
		correctType: string,
		...values: U
	): ValidatorFunction<any> {
		// @ts-ignore: OneOfStrict is essentially Or just with strict values
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return Validator.Or.apply({}, [correctType, ...values.map(Validator.StrictValue)]);
	}

	public static Values = <U>(
		valueValidator: ValidatorFunc<U>,
	): ValidatorFunction<{ [key: string]: U }> => ({
		validate: (input, keyName) => {
			if (input === undefined || input === null) {
				return Either.left({
					correctType: 'object',
					keyName,
					message: 'not defined',
					valueReceived: input,
				});
			}

			if (typeof input !== 'object') {
				return Either.left({
					correctType: 'object',
					keyName,
					message: 'not an object',
					valueReceived: input,
				});
			}

			const errors: ValidatorFailMap['errors'] = {};
			const newInput = input as { [key: string]: unknown };
			let hasError = false;

			for (const key in newInput) {
				if (newInput.hasOwnProperty(key)) {
					const obj = newInput[key];

					const result = callValidator(valueValidator)(keyName)(obj);
					if (result.direction === 'left') {
						errors[key] = result.value;
						hasError = true;
					}
				}
			}

			return !hasError
				? Either.right(input as { [key: string]: U })
				: Either.left({
						correctType: 'object',
						keyName,
						message: 'object properties do not match ',
						errors,
						valueReceived: input,
				  });
		},
	});

	private static RequiredPropertyWrapper = <U>(
		func: ValidatorImpl<U | undefined>,
	): ValidatorImpl<U> => ({
		validate: (input, keyName) =>
			input === undefined
				? Either.left({
						keyName,
						correctType: 'not undefined',
						message: `${keyName} is required`,
						valueReceived: input,
				  })
				: (func as ValidatorImpl<U>).validate(input, keyName),
	});

	// eslint-disable-next-line no-empty-function
	public constructor(public readonly rules: ValidateRuleSet<T>) {}

	public validate = (
		obj: unknown,
		keyName = '',
	): EitherObj<ValidatorFailObject<T> | ValidatorFailBase, T> => {
		if (typeof obj !== 'object') {
			return Either.left({
				correctType: 'object',
				keyName,
				message: 'Value received is not an object',
				valueReceived: obj,
			});
		}

		if (obj === undefined || obj === null) {
			return Either.left({
				correctType: 'object',
				keyName,
				message: 'Object cannot be undefined or null',
				valueReceived: obj,
			});
		}

		const errors: ValidatorFailObject<T>['errors'] = {};
		const returnObject: T = {} as T;

		let hasError = false;

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				const value: unknown = obj[key as keyof object];
				const rule = this.rules[key as keyof T];

				const result = callValidator(rule)(key)(value);

				if (Either.isLeft(result)) {
					hasError = true;
					errors[key] = result.value;
				} else {
					returnObject[key as keyof T] = result.value;
				}
			}
		}

		return hasError
			? Either.left({
					correctType: 'object',
					errors,
					keyName,
					message: 'Object was unable to be verified',
					valueReceived: obj,
			  })
			: Either.right(returnObject);
	};
}
