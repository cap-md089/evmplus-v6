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

import { validator } from 'auto-client-api';
import { Validator, MaybeObj } from 'common-lib';
import 'common-lib/dist/test';

interface BasicType {
	thing: string;
}

interface OptionalThing {
	thing?: string;
}

interface ComplexThing {
	basicThing: BasicType;
}

interface ComplexArrayThing {
	things: BasicType[];
}

interface ExtendsOther extends BasicType {
	otherThing: number;
}

type RequiredType = Required<OptionalThing>;
type OptionalType = Partial<ComplexThing>;

type TypeIntersect = ComplexThing & BasicType;
// type RequiredType2 = {
// 	[P in keyof OptionalThing]-?: OptionalThing[P];
// };

interface GenericType<T> {
	otherThing: string;
	thing: T;
}

type GenericIntersect<T> = GenericType<T> & ComplexThing;

enum TestEnum {
	ITEMONE = 0,
	ITEMTWO = 1,
	ITEMTHREE = 'three',
}

const requiredTypeValidator = validator<RequiredType>(Validator);
const requiredGenericTypeValidator = validator<Required<GenericType<number>>>(Validator);
const optionalGenericTypeValidator = validator<Partial<GenericType<number>>>(Validator);
const optionalTypeValidator = validator<OptionalType>(Validator);
const basicValidator = validator<BasicType>(Validator);
const optionalValidator = validator<OptionalThing>(Validator);
const complexValidator = validator<ComplexThing>(Validator);
const complexArrayValidator = validator<ComplexArrayThing>(Validator);
const testEnumValidator = validator<TestEnum>(Validator);
const extendsOtherValidator = validator<ExtendsOther>(Validator);
const maybeValidator = validator<MaybeObj<number>>(Validator);
// const requiredType2Validator = validator<RequiredType>(Validator);
const genericTypeNumberValidator = validator<GenericType<number>>(Validator);
const genericTypeStringValidator = validator<GenericType<string>>(Validator);
const genericTypeBasicTypeValidator = validator<GenericType<BasicType>>(Validator);
const intersectValidator = validator<TypeIntersect>(Validator);
const genericIntersectValidator = validator<GenericIntersect<number>>(Validator);
// eslint-disable-next-line @typescript-eslint/array-type
const genericArrayValidator = validator<GenericType<string>[]>(Validator);
const genericArrayValidator2 = validator<Array<GenericType<string>>>(Validator);

describe('Validator', () => {
	it('should validate basic properties', () => {
		expect(basicValidator.validate({ thing: 'string' }, '')).toBeRight();
		expect(basicValidator.validate({ nothing: 1 }, '')).toBeLeft();
	});

	it('should validate optional parameters', () => {
		expect(optionalValidator.validate({ thing: 'string' }, '')).toBeRight();
		expect(optionalValidator.validate({}, '')).toBeRight();
		expect(optionalValidator.validate({ thing: 1 }, '')).toBeLeft();
	});

	it('should operate on complex types', () => {
		expect(complexValidator.validate({ basicThing: { thing: 'string' } }, '')).toBeRight();
		expect(complexValidator.validate({ basicThing: { thing: 1 } }, '')).toBeLeft();
		expect(complexValidator.validate({ basicThing: { otherThing: 1 } }, '')).toBeLeft();
		expect(complexValidator.validate({ basicThing: null }, '')).toBeLeft();
		expect(complexValidator.validate({ thing: 'string' }, '')).toBeLeft();

		expect(
			complexArrayValidator.validate(
				{ things: [{ thing: 'string' }, { thing: 'string2' }] },
				'',
			),
		).toBeRight();
		expect(
			complexArrayValidator.validate({ things: [{ thing: 'string' }, { thing: 1 }] }, ''),
		).toBeLeft();
		expect(
			complexArrayValidator.validate({ things: [{ thing: 'string' }, null] }, ''),
		).toBeLeft();
		expect(
			complexArrayValidator.validate({ things: [{ thing: 'string' }, undefined] }, ''),
		).toBeLeft();
	});

	it('should prune basic types', () => {
		expect(
			basicValidator.validate({ thing: 'string', otherThing: 'anotherstring' }, ''),
		).toEqualRight({
			thing: 'string',
		});
	});

	it('should prune complex types', () => {
		expect(
			complexValidator.validate(
				{
					thing: 'string',
					basicThing: { thing: 'string', otherThing: 'string' },
				},
				'',
			),
		).toEqualRight({
			basicThing: {
				thing: 'string',
			},
		});

		expect(
			complexArrayValidator.validate(
				{
					things: [
						{
							thing: 'fdsa',
							anotherThing: 1,
						},
						{
							thing: 'asdf',
						},
					],
					fdsa: 1,
				},
				'',
			),
		).toEqualRight({
			things: [
				{
					thing: 'fdsa',
				},
				{
					thing: 'asdf',
				},
			],
		});
	});

	it('should validate complex unions', () => {
		expect(maybeValidator.validate({ hasValue: false }, '')).toEqualRight({
			hasValue: false,
		});
		expect(maybeValidator.validate({ hasValue: true, value: 0 }, '')).toEqualRight({
			hasValue: true,
			value: 0,
		});
	});

	it('should validate complex intersections', () => {
		expect(
			intersectValidator.validate(
				{
					thing: 'string',
					basicThing: { thing: 'string' },
					otherThing: 'string',
				},
				'',
			),
		).toEqualRight({
			thing: 'string',
			basicThing: { thing: 'string' },
			otherThing: 'string',
		});
		expect(intersectValidator.validate({ basicThing: { thing: 'string' } }, '')).toBeLeft();
		expect(intersectValidator.validate({ thing: 'string' }, '')).toBeLeft();
		expect(intersectValidator.validate({}, '')).toBeLeft();

		expect(
			genericIntersectValidator.validate(
				{ thing: 0, basicThing: { thing: 'string' }, otherThing: 'string' },
				'',
			),
		).toEqualRight({
			thing: 0,
			basicThing: { thing: 'string' },
			otherThing: 'string',
		});
		expect(
			genericIntersectValidator.validate({ basicThing: { thing: 'string' } }, ''),
		).toBeLeft();
		expect(genericIntersectValidator.validate({ thing: 0 }, '')).toBeLeft();
		expect(genericIntersectValidator.validate({}, '')).toBeLeft();
	});

	it('should validate interface extension', () => {
		expect(extendsOtherValidator.validate({ thing: 'string', otherThing: 1 }, '')).toBeRight();
		expect(extendsOtherValidator.validate({ thing: 1, otherThing: 'string' }, '')).toBeLeft();
		expect(extendsOtherValidator.validate({ thing: 'string' }, '')).toBeLeft();
	});

	it('should validate Required/Partial', () => {
		expect(requiredTypeValidator.validate({ thing: 'string' }, '')).toBeRight();
		expect(requiredTypeValidator.validate({ thing: 'string' }, '')).toMatchRight({
			thing: 'string',
		});
		expect(requiredTypeValidator.validate({}, '')).toBeLeft();

		expect(optionalTypeValidator.validate({}, '')).toBeRight();
		expect(
			optionalTypeValidator.validate({ basicThing: { thing: 'string' } }, ''),
		).toEqualRight({
			basicThing: { thing: 'string' },
		});
		expect(optionalTypeValidator.validate({ basicThing: null }, '')).toBeLeft();
		expect(optionalTypeValidator.validate({ thing: null }, '')).toEqualRight({});

		expect(requiredGenericTypeValidator.validate({}, '')).toBeLeft();
		expect(
			requiredGenericTypeValidator.validate({ otherThing: 'string', thing: 0 }, ''),
		).toEqualRight({
			otherThing: 'string',
			thing: 0,
		});
		expect(requiredGenericTypeValidator.validate({ otherThing: null }, '')).toBeLeft();

		expect(optionalGenericTypeValidator.validate({}, '')).toBeRight();
		expect(
			optionalGenericTypeValidator.validate({ otherThing: 'string', thing: 0 }, ''),
		).toEqualRight({
			otherThing: 'string',
			thing: 0,
		});
		expect(optionalGenericTypeValidator.validate({ otherThing: null }, '')).toBeLeft();
		expect(
			optionalGenericTypeValidator.validate({ otherThing: 'string', eh: 'string' }, ''),
		).toEqualRight({ otherThing: 'string' });
		expect(optionalGenericTypeValidator.validate({ thing: 0, eh: 'string' }, '')).toEqualRight({
			thing: 0,
		});
	});

	it('should validate generic types', () => {
		expect(
			genericTypeNumberValidator.validate({ thing: 0, otherThing: 'string' }, ''),
		).toEqualRight({ thing: 0, otherThing: 'string' });
		expect(genericTypeNumberValidator.validate({ thing: 'string' }, '')).toBeLeft();
		expect(genericTypeNumberValidator.validate({}, '')).toBeLeft();

		expect(
			genericTypeStringValidator.validate({ thing: 'string', otherThing: 'string' }, ''),
		).toEqualRight({ thing: 'string', otherThing: 'string' });
		expect(genericTypeStringValidator.validate({ thing: 0 }, '')).toBeLeft();
		expect(genericTypeStringValidator.validate({}, '')).toBeLeft();

		expect(
			genericTypeBasicTypeValidator.validate(
				{ thing: { thing: 'string' }, otherThing: 'string' },
				'',
			),
		).toEqualRight({ thing: { thing: 'string' }, otherThing: 'string' });
		expect(genericTypeBasicTypeValidator.validate({ thing: 0 }, '')).toBeLeft();
		expect(genericTypeBasicTypeValidator.validate({}, '')).toBeLeft();

		expect(
			genericArrayValidator.validate([{ otherThing: 'string', thing: 'string' }], ''),
		).toBeRight();
		expect(genericArrayValidator.validate([{ otherThing: 'string', thing: 0 }], '')).toBeLeft();
		expect(
			genericArrayValidator2.validate([{ otherThing: 'string', thing: 'string' }], ''),
		).toBeRight();
		expect(
			genericArrayValidator2.validate([{ otherThing: 'string', thing: 0 }], ''),
		).toBeLeft();
	});

	describe('built in validator functions', () => {
		describe('Null', () => {
			it('should validate null', () => {
				const nullValidator = validator<null>(Validator);

				expect(nullValidator.validate(null, '')).toBeRight();
				expect(nullValidator.validate(undefined, '')).toBeLeft();
				expect(nullValidator.validate(1, '')).toBeLeft();
				expect(nullValidator.validate('string', '')).toBeLeft();
				expect(nullValidator.validate(false, '')).toBeLeft();
				expect(nullValidator.validate({}, '')).toBeLeft();
				expect(nullValidator.validate([], '')).toBeLeft();
				expect(nullValidator.validate(TestEnum.ITEMONE, '')).toBeLeft();
			});
		});

		describe('String', () => {
			it('should validate strings', () => {
				const stringValidator = validator<string>(Validator);

				expect(stringValidator.validate(null, '')).toBeLeft();
				expect(stringValidator.validate(undefined, '')).toBeLeft();
				expect(stringValidator.validate(1, '')).toBeLeft();
				expect(stringValidator.validate('string', '')).toBeRight();
				expect(stringValidator.validate(false, '')).toBeLeft();
				expect(stringValidator.validate({}, '')).toBeLeft();
				expect(stringValidator.validate([], '')).toBeLeft();
				expect(stringValidator.validate(TestEnum.ITEMONE, '')).toBeLeft();
			});
		});

		describe('Number', () => {
			it('should validate numbers', () => {
				const numberValidator = validator<number>(Validator);

				expect(numberValidator.validate(null, '')).toBeLeft();
				expect(numberValidator.validate(undefined, '')).toBeLeft();
				expect(numberValidator.validate(1, '')).toBeRight();
				expect(numberValidator.validate('string', '')).toBeLeft();
				expect(numberValidator.validate(false, '')).toBeLeft();
				expect(numberValidator.validate({}, '')).toBeLeft();
				expect(numberValidator.validate([], '')).toBeLeft();
			});
		});

		describe('Boolean', () => {
			it('should validate booleans', () => {
				const booleanValidator = validator<boolean>(Validator);
				const booleanValidator2 = validator<false>(Validator);
				const booleanValidator3 = validator<true>(Validator);

				expect(booleanValidator.validate(null, '')).toBeLeft();
				expect(booleanValidator.validate(undefined, '')).toBeLeft();
				expect(booleanValidator.validate(1, '')).toBeLeft();
				expect(booleanValidator.validate('string', '')).toBeLeft();
				expect(booleanValidator.validate(false, '')).toBeRight();
				expect(booleanValidator2.validate(true, '')).toBeLeft();
				expect(booleanValidator2.validate(false, '')).toBeRight();
				expect(booleanValidator3.validate(true, '')).toBeRight();
				expect(booleanValidator3.validate(false, '')).toBeLeft();
				expect(booleanValidator.validate({}, '')).toBeLeft();
				expect(booleanValidator.validate([], '')).toBeLeft();
				expect(booleanValidator.validate(TestEnum.ITEMONE, '')).toBeLeft();
			});
		});

		describe('Arrays', () => {
			const arrayValidator = validator<string[]>(Validator);
			// eslint-disable-next-line @typescript-eslint/array-type
			const arrayValidator2 = validator<Array<string>>(Validator);
			const arrayValidator3 = validator<any[]>(Validator);

			it('should validate arrays of validators', () => {
				expect(arrayValidator.validate(null, '')).toBeLeft();
				expect(arrayValidator.validate(undefined, '')).toBeLeft();
				expect(arrayValidator.validate(1, '')).toBeLeft();
				expect(arrayValidator.validate('string', '')).toBeLeft();
				expect(arrayValidator.validate(false, '')).toBeLeft();
				expect(arrayValidator.validate({}, '')).toBeLeft();
				expect(arrayValidator.validate([], '')).toBeRight();
				expect(arrayValidator.validate(TestEnum.ITEMONE, '')).toBeLeft();
				expect(arrayValidator.validate(['string'], '')).toBeRight();
				expect(arrayValidator.validate(['string', 'string 2'], '')).toBeRight();
				expect(arrayValidator.validate([1, 'string 2'], '')).toBeLeft();
				expect(arrayValidator.validate([1], '')).toBeLeft();

				expect(arrayValidator2.validate(null, '')).toBeLeft();
				expect(arrayValidator2.validate(undefined, '')).toBeLeft();
				expect(arrayValidator2.validate(1, '')).toBeLeft();
				expect(arrayValidator2.validate('string', '')).toBeLeft();
				expect(arrayValidator2.validate(false, '')).toBeLeft();
				expect(arrayValidator2.validate({}, '')).toBeLeft();
				expect(arrayValidator2.validate([], '')).toBeRight();
				expect(arrayValidator2.validate(TestEnum.ITEMONE, '')).toBeLeft();
				expect(arrayValidator2.validate(['string'], '')).toBeRight();
				expect(arrayValidator2.validate(['string', 'string 2'], '')).toBeRight();
				expect(arrayValidator2.validate([1, 'string 2'], '')).toBeLeft();
				expect(arrayValidator2.validate([1], '')).toBeLeft();

				expect(arrayValidator3.validate(null, '')).toBeLeft();
				expect(arrayValidator3.validate(undefined, '')).toBeLeft();
				expect(arrayValidator3.validate(1, '')).toBeLeft();
				expect(arrayValidator3.validate('string', '')).toBeLeft();
				expect(arrayValidator3.validate(false, '')).toBeLeft();
				expect(arrayValidator3.validate({}, '')).toBeLeft();
				expect(arrayValidator3.validate([], '')).toBeRight();
				expect(arrayValidator3.validate(TestEnum.ITEMONE, '')).toBeLeft();
				expect(arrayValidator3.validate(['string'], '')).toBeRight();
				expect(arrayValidator3.validate(['string', 'string 2'], '')).toBeRight();
				expect(arrayValidator3.validate([1, 'string 2'], '')).toBeRight();
				expect(arrayValidator3.validate([1], '')).toBeRight();
			});
		});

		describe('Enums', () => {
			it('should validate enums', () => {
				expect(testEnumValidator.validate(null, '')).toBeLeft();
				expect(testEnumValidator.validate(undefined, '')).toBeLeft();
				expect(testEnumValidator.validate('string', '')).toBeLeft();
				expect(testEnumValidator.validate(false, '')).toBeLeft();
				expect(testEnumValidator.validate({}, '')).toBeLeft();
				expect(testEnumValidator.validate([], '')).toBeLeft();
				expect(testEnumValidator.validate(TestEnum.ITEMONE, '')).toBeRight();
				expect(testEnumValidator.validate(TestEnum.ITEMTWO, '')).toBeRight();
				expect(testEnumValidator.validate(TestEnum.ITEMTHREE, '')).toBeRight();
				expect(testEnumValidator.validate(0, '')).toBeRight();
				expect(testEnumValidator.validate(1, '')).toBeRight();
				expect(testEnumValidator.validate(2, '')).toBeLeft();
				expect(testEnumValidator.validate(3, '')).toBeLeft();
				expect(testEnumValidator.validate('three', '')).toBeRight();
			});
		});

		describe('union types', () => {
			const or = validator<string | number>(Validator);
			const or2 = validator<ComplexThing | BasicType>(Validator);

			it('should validate union types', () => {
				expect(or.validate(2, '')).toBeRight();
				expect(or.validate('string', '')).toBeRight();
				expect(or.validate([], '')).toBeLeft();
				expect(or.validate(null, '')).toBeLeft();
				expect(or.validate(undefined, '')).toBeLeft();

				expect(or2.validate(2, '')).toBeLeft();
				expect(or2.validate('string', '')).toBeLeft();
				expect(or2.validate([], '')).toBeLeft();
				expect(or2.validate(null, '')).toBeLeft();
				expect(or2.validate(undefined, '')).toBeLeft();
				expect(or2.validate({ basicThing: { thing: 'string ' } }, '')).toBeRight();
				expect(or2.validate({ thing: 'string' }, '')).toBeRight();
			});
		});

		it('should validate strict values', () => {
			const stringValidator = validator<'string'>(Validator);

			expect(stringValidator.validate('string', '')).toBeRight();
			expect(stringValidator.validate('strin', '')).toBeLeft();
			expect(stringValidator.validate('other string', '')).toBeLeft();
			expect(stringValidator.validate(0, '')).toBeLeft();
			expect(stringValidator.validate(null, '')).toBeLeft();
			expect(stringValidator.validate(undefined, '')).toBeLeft();
		});

		it('should validate an object by its values', () => {
			const mapValidator = validator<{ [key: string]: string }>(Validator);

			expect(mapValidator.validate({ hi: 'string' }, '')).toBeRight();
			expect(mapValidator.validate({ other: 'other' }, '')).toBeRight();
			expect(mapValidator.validate({ other: 1 }, '')).toBeLeft();
			expect(mapValidator.validate({ other: null }, '')).toBeLeft();
			expect(mapValidator.validate({ other: undefined }, '')).toBeLeft();
			expect(mapValidator.validate('other string', '')).toBeLeft();
			expect(mapValidator.validate(0, '')).toBeLeft();
			expect(mapValidator.validate(null, '')).toBeLeft();
			expect(mapValidator.validate(undefined, '')).toBeLeft();
		});
	});
});
