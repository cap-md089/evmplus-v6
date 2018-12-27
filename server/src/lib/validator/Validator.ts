interface ValidatorResult {
	valid: boolean;
}

interface ValidatorFail extends ValidatorResult {
	valid: false;
	message: string;
}

interface ValidatorPass extends ValidatorResult {
	valid: true;
}

type ValidatorFunction = (obj: unknown) => ValidatorFail | ValidatorPass;

type RequiredCheckFunction = (value: any, baseObj: any) => boolean;

interface ValidateRule {
	validator: ValidatorFunction | Validator<any>;
	required?: boolean;
	requiredIf?: RequiredCheckFunction;
}

type ValidateRuleSet<T> = { [P in keyof T]: ValidateRule };

interface ValidateError<T> {
	property: keyof T;
	message: string;
}

export interface BasicValidatedRequest<T> extends AccountRequest {
	body: T;
}

export interface MemberValidatedRequest<T> extends MemberRequest {
	body: T;
}

export interface ConditionalMemberValidatedRequest<T>
	extends ConditionalMemberRequest {
	body: T;
}

export default class Validator<T> {
	public static BodyExpressMiddleware = (
		validator: Validator<any>
	): express.RequestHandler => (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			res.end();
			return;
		}

		if (validator.validate(req.body)) {
			req.body = validator.prune(req.body);

			next();
		} else {
			res.status(400);
			res.json(validator.getErrors());
		}
	};

	public static PartialBodyExpressMiddleware = (
		validator: Validator<any>
	): express.RequestHandler => (req, res, next) => {
		if (req.body === undefined || req.body === null) {
			res.status(400);
			res.end();
			return;
		}

		if (validator.validate(req.body, true)) {
			req.body = validator.partialPrune(req.body);

			next();
		} else {
			res.status(400);
			res.json(validator.getErrors());
		}
	};

	public static Nothing: ValidatorFunction = (input: unknown) =>
		input === undefined || input === null
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be null or undefined'
			  };

	public static Anything: ValidatorFunction = (input: unknown) => ({
		valid: true
	});

	public static Number: ValidatorFunction = (input: unknown) =>
		typeof input === 'number'
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be a number'
			  };

	public static String: ValidatorFunction = (input: unknown) =>
		typeof input === 'string'
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be a string'
			  };

	public static Boolean: ValidatorFunction = (input: unknown) =>
		typeof input === 'boolean'
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be a boolean'
			  };

	public static Array: ValidatorFunction = (input: unknown) =>
		Array.isArray(input)
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'must be an array'
			  };

	public static Enum = (value: any): ValidatorFunction => (input: unknown) =>
		value[input as any] === undefined
			? {
					valid: false,
					message: 'not a proper enum variable'
			  }
			: {
					valid: true
			  };

	public static ArrayOf = (
		validator: ValidatorFunction | Validator<any>
	): ValidatorFunction => (input: unknown) => {
		if (!Array.isArray(input)) {
			return {
				valid: false,
				message: 'must be an array'
			};
		}

		let good = true;

		for (const i of input) {
			if (validator instanceof Validator) {
				if (!validator.validate(i)) {
					good = false;
					break;
				}
			} else {
				if (!validator(i).valid) {
					good = false;
					break;
				}
			}
		}

		return good
			? {
					valid: true
			  }
			: {
					valid: false,
					message:
						'elements in the array do not match the required type'
			  };
	};

	public static Or = (
		...validators: Array<Validator<any> | ValidatorFunction>
	): ValidatorFunction => (input: unknown) => {
		const errors = [];

		for (const validator of validators) {
			if (validator instanceof Validator) {
				const result = validator.validate(input);
				if (!result) {
					errors.push(validator.getErrorString());
				}
			} else {
				const result = validator(input);
				if (!result.valid) {
					errors.push((result as ValidatorFail).message);
				}
			}
		}

		return errors.length !== validators.length
			? {
					valid: true
			  }
			: {
					valid: false,
					message: errors.join('; ')
			  };
	};

	public static And = (
		...validators: Array<Validator<any> | ValidatorFunction>
	): ValidatorFunction => (input: unknown) => {
		const errors = [];

		for (const validator of validators) {
			if (validator instanceof Validator) {
				const result = validator.validate(input);
				if (!result) {
					errors.push(validator.getErrorString());
				}
			} else {
				const result = validator(input);
				if (!result.valid) {
					errors.push((result as ValidatorFail).message);
				}
			}
		}

		return errors.length !== 0
			? {
					valid: true
			  }
			: {
					valid: false,
					message: errors.join('; ')
			  };
	};

	public static CheckboxReturn: ValidatorFunction = input =>
		Validator.Array(input).valid &&
		Validator.ArrayOf(Validator.Boolean)((input as any[])[0]).valid &&
		Validator.String((input as any[])[1]).valid
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'not a valid checkbox return value'
			  };

	public static RadioReturn = (rrEnum: any): ValidatorFunction => input =>
		Validator.Array(input).valid &&
		Validator.Enum(rrEnum)((input as any[])[0]).valid &&
		Validator.String((input as any[])[1]).valid
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'not a valid radio return value'
			  };

	public static MemberReference: ValidatorFunction = input =>
		MemberBase.isReference(input)
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'not a valid member reference'
			  };

	public static StrictValue = (value: any): ValidatorFunction => input =>
		input === value
			? {
					valid: true
			  }
			: {
					valid: false,
					message: 'does not equal ' + value
			  };

	public static OneOfStrict = (...values: any[]): ValidatorFunction =>
		Validator.Or.apply(
			{},
			values.map(value => Validator.StrictValue(value))
		);

	private rules: ValidateRuleSet<T>;

	private errors: Array<ValidateError<T>> = [];

	protected constructor(rules: ValidateRuleSet<T>) {
		this.rules = rules;
	}

	public validate(obj: any, partial?: false): obj is T;
	public validate(obj: any, partial: true): obj is Partial<T>;

	public validate(obj: any, partial?: boolean) {
		this.errors = [];

		if (obj === undefined || obj === null) {
			return false;
		}

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				const value = obj[key];
				const rule = this.rules[key];

				if (value === undefined || value === null) {
					if (rule.required !== false && !partial) {
						if (rule.requiredIf && rule.requiredIf(value, obj)) {
							this.errors.push({
								property: key,
								message: 'property is required'
							});
						}
					}
					continue;
				}

				if (rule.validator instanceof Validator) {
					if (!rule.validator.validate(value)) {
						this.errors.push({
							property: key,
							message: rule.validator.getErrorString()
						});
					}
				} else {
					const validateResult = rule.validator(value);

					if (!validateResult.valid) {
						this.errors.push({
							message: (validateResult as ValidatorFail).message,
							property: key
						});
					}
				}
			}
		}

		return this.errors.length === 0;
	}

	public partialPrune<S extends Partial<T>>(obj: S, target?: T): Partial<T> {
		const newObject: Partial<T> = target || {};

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				if (obj[key] !== undefined) {
					newObject[key] = obj[key];
				}
			}
		}

		return newObject;
	}

	public prune<S extends T>(obj: S, target?: T): T {
		const newObject = target || ({} as T);

		for (const key in this.rules) {
			if (this.rules.hasOwnProperty(key)) {
				newObject[key] = obj[key];
			}
		}

		return newObject;
	}

	public getErrors(): Array<ValidateError<T>> {
		return this.errors;
	}

	public getErrorString(): string {
		return this.errors
			.map(err => `${err.property}: (${err.message})`)
			.join('; ');
	}
}

import * as express from 'express';
import { AccountRequest } from '../Account';
import MemberBase from '../Members';
import { ConditionalMemberRequest, MemberRequest } from '../members/NHQMember';