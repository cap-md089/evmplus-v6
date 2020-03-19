import { Validator, ValidatorFail } from '../../lib/internals';

interface BasicType {
	thing: string;
}

interface OptionalThing {
	thing?: string;
}

interface ComplexThing {
	basicThing: BasicType;
}

interface OptionalDependent1 {
	lacking: true;
}

interface OptionalDependent2 {
	lacking: false;
	item: number;
}

interface ComplexArrayThing {
	things: BasicType[];
}

type OptionalDependent = OptionalDependent1 | OptionalDependent2;

const basicValidator = new Validator<BasicType>({
	thing: {
		validator: Validator.String,
		required: true
	}
});

const optionalValidator = new Validator<OptionalThing>({
	thing: {
		validator: Validator.String,
		required: false
	}
});

const complexValidator = new Validator<ComplexThing>({
	basicThing: {
		validator: basicValidator
	}
});

const complexArrayValidator = new Validator<ComplexArrayThing>({
	things: {
		validator: Validator.ArrayOf(basicValidator)
	}
});

const optionalDependentValidator = new Validator<OptionalDependent>({
	item: {
		validator: Validator.Number,
		requiredIf: (val, base) => {
			return base.lacking === false;
		}
	},
	lacking: {
		validator: Validator.Boolean as any
	}
});

enum TestEnum {
	ITEMONE,
	ITEMTWO
}
const testEnumValidator = Validator.Enum(TestEnum);

describe('Validator', () => {
	it('should validate basic properties', () => {
		expect(basicValidator.validate({ thing: 'string' })).toEqual(true);
		expect(basicValidator.validate({ nothing: 1 })).toEqual(false);
	});

	it('should validate optional parameters', () => {
		expect(optionalValidator.validate({ thing: 'string' })).toEqual(true);
		expect(optionalValidator.validate({})).toEqual(true);
		expect(optionalValidator.validate({ thing: 1 })).toEqual(false);
	});

	it('should operate on complex types', () => {
		expect(complexValidator.validate({ basicThing: { thing: 'string' } })).toEqual(true);
		expect(complexValidator.validate({ basicThing: { thing: 1 } })).toEqual(false);
		expect(complexValidator.validate({ basicThing: { otherThing: 1 } })).toEqual(false);
		expect(complexValidator.validate({ basicThing: null })).toEqual(false);
		expect(complexValidator.validate({ thing: 'string' })).toEqual(false);

		expect(
			complexArrayValidator.validate({ things: [{ thing: 'string' }, { thing: 'string2' }] })
		).toEqual(true);
		expect(
			complexArrayValidator.validate({ things: [{ thing: 'string' }, { thing: 1 }] })
		).toEqual(false);
		expect(complexArrayValidator.validate({ things: [{ thing: 'string' }, null] })).toEqual(
			false
		);
		expect(
			complexArrayValidator.validate({ things: [{ thing: 'string' }, undefined] })
		).toEqual(false);
	});

	it('should prune basic types', () => {
		expect(basicValidator.prune({ thing: 'string', otherThing: 'anotherstring' })).toEqual({
			thing: 'string'
		});
	});

	it('should return error messages for complex types', () => {
		expect(basicValidator.validate({ nothing: 'string' })).toEqual(false);
		expect(basicValidator.getErrorString()).toEqual('thing: (property is required)');
		expect(basicValidator.getErrors()).toEqual([
			{
				property: 'thing',
				message: 'property is required'
			}
		]);

		expect(basicValidator.validate({ thing: 2 })).toEqual(false);
		expect(basicValidator.getErrorString()).toEqual('thing: (must be a string)');
		expect(basicValidator.getErrors()).toEqual([
			{
				property: 'thing',
				message: 'must be a string'
			}
		]);
	});

	it('should not return error messages for successful complex types', () => {
		expect(basicValidator.validate({ thing: 'string' })).toEqual(true);
		expect(basicValidator.getErrorString()).toEqual('');
		expect(basicValidator.getErrors()).toEqual([]);
	});

	it('should prune complex types', () => {
		expect(
			complexValidator.prune({
				thing: 'string',
				basicThing: { thing: 'string', otherThing: 'string' }
			})
		).toEqual({
			basicThing: {
				thing: 'string'
			}
		});

		expect(
			expect(
				complexArrayValidator.prune({
					things: [
						{
							thing: 'fdsa',
							anotherThing: 1
						},
						{
							thing: 'asdf'
						}
					],
					fdsa: 1
				})
			).toEqual({
				things: [
					{
						thing: 'fdsa'
					},
					{
						thing: 'asdf'
					}
				]
			})
		);
	});

	describe('built in validator functions', () => {
		describe('Nothing', () => {
			it('should validate nothing', () => {
				expect(Validator.Nothing(null).valid).toEqual(true);
				expect(Validator.Nothing(undefined).valid).toEqual(true);
				expect(Validator.Nothing(1).valid).toEqual(false);
				expect(Validator.Nothing('string').valid).toEqual(false);
				expect(Validator.Nothing(false).valid).toEqual(false);
				expect(Validator.Nothing({}).valid).toEqual(false);
				expect(Validator.Nothing([]).valid).toEqual(false);
				expect(Validator.Nothing(TestEnum.ITEMONE).valid).toEqual(false);
			});

			it('should provide the correct error message', () => {
				expect(
					((Validator.Nothing(null) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).not.toBeDefined();
				expect(
					((Validator.Nothing(undefined) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).not.toBeDefined();
				expect(
					((Validator.Nothing('') as unknown) as ValidatorFail<null | undefined>).message!
				).toBeDefined();
			});
		});

		describe('Null', () => {
			it('should validate null', () => {
				expect(Validator.Null(null).valid).toEqual(true);
				expect(Validator.Null(undefined).valid).toEqual(false);
				expect(Validator.Null(1).valid).toEqual(false);
				expect(Validator.Null('string').valid).toEqual(false);
				expect(Validator.Null(false).valid).toEqual(false);
				expect(Validator.Null({}).valid).toEqual(false);
				expect(Validator.Null([]).valid).toEqual(false);
				expect(Validator.Null(TestEnum.ITEMONE).valid).toEqual(false);
			});

			it('should provide the correct error message', () => {
				expect(
					((Validator.Null(null) as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
				expect(
					((Validator.Null(undefined) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((Validator.Null('') as unknown) as ValidatorFail<null | undefined>).message!
				).toBeDefined();
			});
		});

		describe('String', () => {
			it('should validate strings', () => {
				expect(Validator.String(null).valid).toEqual(false);
				expect(Validator.String(undefined).valid).toEqual(false);
				expect(Validator.String(1).valid).toEqual(false);
				expect(Validator.String('string').valid).toEqual(true);
				expect(Validator.String(false).valid).toEqual(false);
				expect(Validator.String({}).valid).toEqual(false);
				expect(Validator.String([]).valid).toEqual(false);
				expect(Validator.String(TestEnum.ITEMONE).valid).toEqual(false);
			});

			it('should provide the correct error message', () => {
				expect(
					((Validator.String(null) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((Validator.String(undefined) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((Validator.String('') as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
			});
		});

		describe('Number', () => {
			it('should validate numbers', () => {
				expect(Validator.Number(null).valid).toEqual(false);
				expect(Validator.Number(undefined).valid).toEqual(false);
				expect(Validator.Number(1).valid).toEqual(true);
				expect(Validator.Number('string').valid).toEqual(false);
				expect(Validator.Number(false).valid).toEqual(false);
				expect(Validator.Number({}).valid).toEqual(false);
				expect(Validator.Number([]).valid).toEqual(false);
			});

			it('should provide the correct error message', () => {
				expect(
					((Validator.Number(undefined) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((Validator.Number(1) as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
			});
		});

		describe('Boolean', () => {
			it('should validate booleans', () => {
				expect(Validator.Boolean(null).valid).toEqual(false);
				expect(Validator.Boolean(undefined).valid).toEqual(false);
				expect(Validator.Boolean(1).valid).toEqual(false);
				expect(Validator.Boolean('string').valid).toEqual(false);
				expect(Validator.Boolean(false).valid).toEqual(true);
				expect(Validator.Boolean({}).valid).toEqual(false);
				expect(Validator.Boolean([]).valid).toEqual(false);
				expect(Validator.Boolean(TestEnum.ITEMONE).valid).toEqual(false);
			});

			it('should provide the correct error message', () => {
				expect(
					((Validator.Boolean(undefined) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((Validator.Boolean(false) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).not.toBeDefined();
			});
		});

		describe('Arrays', () => {
			it('should validate arrays in general', () => {
				expect(Validator.Array(null).valid).toEqual(false);
				expect(Validator.Array(undefined).valid).toEqual(false);
				expect(Validator.Array(1).valid).toEqual(false);
				expect(Validator.Array('string').valid).toEqual(false);
				expect(Validator.Array(false).valid).toEqual(false);
				expect(Validator.Array({}).valid).toEqual(false);
				expect(Validator.Array([]).valid).toEqual(true);
				expect(Validator.Array(TestEnum.ITEMONE).valid).toEqual(false);
			});

			it('should return the correct error message in general', () => {
				expect(
					((Validator.Array(undefined) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((Validator.Array([]) as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
			});

			const arrayValidator = Validator.ArrayOf(Validator.String);

			it('should validate arrays of validators', () => {
				expect(arrayValidator(['string']).valid).toEqual(true);
				expect(arrayValidator([]).valid).toEqual(true);
				expect(arrayValidator(['string', 'string 2']).valid).toEqual(true);
				expect(arrayValidator([1]).valid).toEqual(false);
				expect(arrayValidator([1, 'string']).valid).toEqual(false);
				expect(arrayValidator(null).valid).toEqual(false);
				expect(arrayValidator(undefined).valid).toEqual(false);
			});

			it('should return the correct error message for validators', () => {
				expect(
					((arrayValidator(null) as unknown) as ValidatorFail<null | undefined>).message!
				).toBeDefined();
				expect(
					((arrayValidator([]) as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
			});
		});

		describe('Enums', () => {
			it('should validate enums', () => {
				expect(testEnumValidator(null).valid).toEqual(false);
				expect(testEnumValidator(undefined).valid).toEqual(false);
				expect(testEnumValidator(4).valid).toEqual(false);
				expect(testEnumValidator('string').valid).toEqual(false);
				expect(testEnumValidator(false).valid).toEqual(false);
				expect(testEnumValidator({}).valid).toEqual(false);
				expect(testEnumValidator([]).valid).toEqual(false);
				expect(testEnumValidator(TestEnum.ITEMONE).valid).toEqual(true);
				expect(testEnumValidator(TestEnum.ITEMTWO).valid).toEqual(true);
				expect(testEnumValidator(3).valid).toEqual(false);
			});

			it('should return the correct error message', () => {
				expect(
					((testEnumValidator(null) as unknown) as ValidatorFail<null | undefined>)
						.message!
				).toBeDefined();
				expect(
					((testEnumValidator(TestEnum.ITEMONE) as unknown) as ValidatorFail<
						null | undefined
					>).message!
				).not.toBeDefined();
			});
		});

		describe('union types', () => {
			const or = Validator.Or(Validator.String, Validator.Number);
			const or2 = Validator.Or(complexValidator, basicValidator);

			it('should validate union types', () => {
				expect(or(2).valid).toEqual(true);
				expect(or('string').valid).toEqual(true);
				expect(or([]).valid).toEqual(false);
				expect(or(null).valid).toEqual(false);
				expect(or(undefined).valid).toEqual(false);

				expect(or2({ basicThing: { thing: 'string' } }).valid).toEqual(true);
				expect(or2({ thing: 'string' }).valid).toEqual(true);
				expect(or2(undefined).valid).toEqual(false);
				expect(or2(null).valid).toEqual(false);
				expect(or2({}).valid).toEqual(false);
			});

			it('should provide the correct error message', () => {
				expect(
					((or(null) as unknown) as ValidatorFail<null | undefined>).message!
				).toBeDefined();
				expect(
					((or(1) as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
			});
		});

		describe('Intersection types', () => {
			const and = Validator.And(Validator.String, Validator.Number);
			const and2 = Validator.And(complexValidator, basicValidator);

			it('should validate intersection types', () => {
				// All should fail, because it's impossible to be (string & number)
				expect(and(2).valid).toEqual(false);
				expect(and('string').valid).toEqual(false);
				expect(and([]).valid).toEqual(false);
				expect(and(null).valid).toEqual(false);
				expect(and(undefined).valid).toEqual(false);

				expect(and2({ thing: 'string', basicThing: { thing: 'string' } }).valid).toEqual(
					true
				);
				expect(and2({ basicThing: { thing: 'string' } }).valid).toEqual(false);
				expect(and2({ thing: 'string' }).valid).toEqual(false);
				expect(and2(undefined).valid).toEqual(false);
				expect(and2(null).valid).toEqual(false);
				expect(and2({}).valid).toEqual(false);
			});

			it('should provide the correct error messages', () => {
				expect(
					((and(null) as unknown) as ValidatorFail<null | undefined>).message!
				).toBeDefined();
				expect(
					((and2({
						thing: 'string',
						basicThing: { thing: 'string' }
					}) as unknown) as ValidatorFail<null | undefined>).message!
				).not.toBeDefined();
			});
		});

		describe('CAPUnit.com types', () => {
			it('should validate member references', () => {
				// NHQMember checks MemberBase.isReference
				expect(
					Validator.MemberReference({ id: 542488, type: 'CAPNHQMember' }).valid
				).toEqual(true);
				expect(Validator.MemberReference(null).valid).toEqual(false);
				expect(Validator.MemberReference(undefined).valid).toEqual(false);
			});
		});

		it('should validate strict values', () => {
			expect(Validator.StrictValue('string')('string').valid).toEqual(true);
			expect(Validator.StrictValue('string')('strin').valid).toEqual(false);
			expect(Validator.StrictValue('string')(0).valid).toEqual(false);
			expect(Validator.StrictValue('string')(null).valid).toEqual(false);
			expect(Validator.StrictValue('string')(undefined).valid).toEqual(false);
		});

		it('should validate a set of strict values', () => {
			expect(Validator.OneOfStrict('string1', 2)('string1').valid).toEqual(true);
			expect(Validator.OneOfStrict('string1', 2)(2).valid).toEqual(true);
			expect(Validator.OneOfStrict('string1', 2)(1).valid).toEqual(false);
			expect(Validator.OneOfStrict('string1', 2)('string2').valid).toEqual(false);
			expect(Validator.OneOfStrict('string1', 2)(null).valid).toEqual(false);
			expect(Validator.OneOfStrict('string1', 2)(undefined).valid).toEqual(false);
		});

		it('should validate an object by its values', () => {
			expect(Validator.Values(Validator.String)({ hi: 'string' }).valid).toEqual(true);
			expect(Validator.Values(Validator.String)({ other: 'other' }).valid).toEqual(true);
			expect(Validator.Values(Validator.String)({ other: 1 }).valid).toEqual(false);
			expect(Validator.Values(Validator.String)({ other: null }).valid).toEqual(false);
			expect(Validator.Values(Validator.String)({ other: undefined }).valid).toEqual(false);
			expect(Validator.Values(Validator.String)(null).valid).toEqual(false);
			expect(Validator.Values(Validator.String)(undefined).valid).toEqual(false);
		});

		it('should allow for having conditional required', () => {
			expect(optionalDependentValidator.validate({ lacking: true })).toEqual(true);
			expect(optionalDependentValidator.validate({ lacking: false })).toEqual(false);
			expect(optionalDependentValidator.validate({ lacking: false, item: 3 })).toEqual(true);
		});
	});
});
