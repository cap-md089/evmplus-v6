import { left, right } from '../lib/Either';
import { just, none } from '../lib/Maybe';

const normalize = (v: any) => JSON.parse(JSON.stringify(v));

describe('Maybe', () => {
	it('should properly map values', () => {
		const value1 = just(5).map(v => `Number ${v}`);

		expect(value1).toMatchObject(normalize(just('Number 5')));

		const value2 = none().map(v => `Number ${v}`);

		expect(value2).toMatchObject(normalize(none()));
	});

	it('should allow for default values', () => {
		const value1 = just(5).orElse(3);

		expect(normalize(value1)).toEqual(normalize(just(5)));

		const value2 = none().orElse(3);

		expect(normalize(value2)).toEqual(normalize(just(3)));
	});

	it('should allow for flat mapping with fast failure', () => {
		const value1 = just(5)
			.flatMap(v => (v < 2 ? none<number>() : just(v - 5)))
			.map(v => v + 5);

		expect(normalize(value1)).toEqual(normalize(just(5)));

		const value2 = just(0)
			.flatMap(v => (v < 2 ? none<number>() : just(v - 5)))
			.map(v => v + 5);

		expect(normalize(value2)).toEqual(normalize(none()));

		const value3 = none<number>()
			.flatMap(v => (v < 2 ? none<number>() : just(v - 5)))
			.map(v => v + 5);

		expect(normalize(value3)).toEqual(normalize(none()));
	});

	it('should allow for filtering', () => {
		const value1 = just(5);

		expect(normalize(value1.filter(v => v > 0))).toEqual(normalize(just(5)));
		expect(normalize(value1.filter(v => v < 0))).toEqual(normalize(none()));
	});

	it('should catamorphize', () => {
		const value = just(5);

		const cataFn1 = () => 'empty';
		const cataFn2 = (v: number) => `num ${v}`;

		expect(value.cata(cataFn1, cataFn2)).toEqual('num 5');
		expect(none<number>().cata(cataFn1, cataFn2)).toEqual('empty');
	});

	it('should come to a single value', () => {
		expect(none().join()).toEqual(null);
		expect(just(5).join()).toEqual(5);
	});

	it('should get a final result', () => {
		expect(none<number>().chain(v => v + 5)).toEqual(null);
		expect(just(0).chain(v => v + 5)).toEqual(5);
	});

	it('should convert to either', () => {
		expect(normalize(none().toEither('error'))).toEqual(normalize(left('error')));
		expect(normalize(just(5).toEither('error'))).toEqual(normalize(right(5)));
	});

	it('should apply curried functions in maybe properly', () => {
		const fn = just((v: number) => v + 5);

		expect(normalize(just(5).ap(fn))).toEqual(normalize(just(10)));
	});

	it('should run a function if none', () => {
		const unused = jest.fn();
		const shouldBeUsed = jest.fn();

		none().orElseRun(shouldBeUsed);
		just(5).orElseRun(unused);

		expect(shouldBeUsed).toHaveBeenCalled();
		expect(unused).not.toHaveBeenCalled();
	});

	it('should convert to none if necessary', () => {
		expect(normalize(none().orNoneIf(true))).toEqual(normalize(none()));
		expect(normalize(none().orNoneIf(false))).toEqual(normalize(none()));
		expect(normalize(just(5).orNoneIf(true))).toEqual(normalize(none()));
		expect(normalize(just(5).orNoneIf(false))).toEqual(normalize(normalize(just(5))));
	});

	it('should throw an error getting a value from some on none', () => {
		expect(just(5).some()).toEqual(5);

		expect(() => {
			none().some();
		}).toThrow();
	});

	it('should return value or default', () => {
		expect(just(5).orSome(3)).toEqual(5);
		expect(none().orSome(3)).toEqual(3);
	});

	it('should allow for creating a closure that can operate on the value, while specifying a default', () => {
		expect(just(5).fold(3)(v => v + 3)).toEqual(8);
		expect(none<number>().fold(3)(v => v + 3)).toEqual(3);
	});
});
