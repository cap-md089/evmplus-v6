import { Either, left, right } from '../lib/Either';
import { just, none } from '../lib/Maybe';

const normalize = (v: any) => JSON.parse(JSON.stringify(v));

const testLeft = (v: string) => normalize(left<string, number>(v));
const testRight = (v: number) => normalize(right<string, number>(v));

describe('Either', () => {
	it('should fail fast', () => {
		const result = left<string, number>('failure')
			.map(x => x + 1)
			.map(x => x * 2);

		expect(normalize(result)).toEqual(testLeft('failure'));

		const flatResult = left<string, number>('failure')
			.flatMap(x => (x < 2 ? left<string, number>('too low') : right<string, number>(x - 5)))
			.map(v => v + 5);

		expect(normalize(flatResult)).toEqual(testLeft('failure'));

		const startedOkFlatResult = right<string, number>(0)
			.flatMap(x => (x < 2 ? left<string, number>('too low') : right<string, number>(x - 5)))
			.map(v => v + 5);

		expect(normalize(startedOkFlatResult)).toEqual(testLeft('too low'));
	});

	it('should pass along mapped values', () => {
		const result = right<string, number>(5)
			.map(x => x + 1)
			.map(x => x * 2);

		expect(normalize(result)).toEqual(testRight(12));

		const flatResult = right<string, number>(5).flatMap(x =>
			x < 2 ? left<string, number>('too low') : right<string, number>(x - 5)
		);

		expect(normalize(flatResult)).toEqual(testRight(0));
	});

	it('should convert to Maybe', () => {
		const eitherNone = left<string, number>('error').toSome();

		expect(normalize(eitherNone)).toMatchObject(normalize(none()));

		const eitherSome = right<string, number>(5).toSome();

		expect(normalize(eitherSome)).toMatchObject(normalize(just(5)));
	});

	it('should properly catamorphize', () => {
		const eitherTestFunc = (e: Either<string, number>) =>
			e.map(v => v + 5).cata(err => `Error: ${err}`, num => `Number: ${num}`);

		const either1 = left<string, number>('error');
		const either2 = right<string, number>(5);

		expect(eitherTestFunc(either1)).toEqual('Error: error');
		expect(eitherTestFunc(either2)).toEqual('Number: 10');
	});

	it('should properly state its alighment', () => {
		expect(left<number, number>(3).isLeft()).toBe(true);
		expect(right<number, number>(3).isLeft()).toBe(false);
		expect(left<number, number>(3).isRight()).toBe(false);
		expect(right<number, number>(3).isRight()).toBe(true);
	});
});
