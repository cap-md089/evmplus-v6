import { Either, left, right } from './Either';

export type MaybeObj<T> = JustObj<T> | NoneObj<T>;

export interface JustObj<T> {
	hasValue: true;

	value: T;
}

export interface NoneObj<T> {
	hasValue: false;
}

export type Maybe<T> = Just<T> | None<T>;

export class Just<T> implements JustObj<T> {
	public readonly hasValue: true = true;

	constructor(public readonly value: T) {
		if (value === null || value === undefined) {
			throw new Error('Value supplied to just is null');
		}
	}

	public isSome = () => true;

	public isNone = () => false;

	public map = <U>(f: (v: T) => U): Maybe<U> => just(f(this.value));

	public orElse = (defaultValue: T): Maybe<T> => this;

	public flatMap = <U>(f: (v: T) => Maybe<U>): Maybe<U> => f(this.value);

	public join = (): T => this.value;

	public filter = (f: (v: T) => boolean): Maybe<T> => (f(this.value) ? this : none());

	public filterType = <U extends T = T>(f: (v: T) => v is U): Maybe<U> =>
		f(this.value) ? ((this as unknown) as Just<U>) : none();

	public cata = <U>(nf: () => U, f: (v: T) => U): U => f(this.value);

	public chain = <U>(f: (v: T) => U): U | null => this.map(f).join();

	public toEither = <L>(defaultLeft: L): Either<L, T> => right(this.value);

	public ap = <U>(fn: Maybe<(v: T) => U>): Maybe<U> => fn.map(f => f(this.value));

	public orElseRun = (fn: () => void): void => void 0;

	public orNoneIf = (beNone: boolean): Maybe<T> => (beNone ? none() : this);

	public orNull = (): T | null => this.value;

	public some = (): T => this.value;

	public orSome = (value: T): T => this.value;

	public fold = <U>(value: U): ((f: (v: T) => U) => U) => f => f(this.value);
}

export class None<T> implements NoneObj<T> {
	public readonly hasValue: false = false;

	public isSome = () => false;

	public isNone = () => true;

	public map = <U>(f: (v: T) => U): Maybe<U> => none();

	public orElse = (defaultValue: T): Maybe<T> => just(defaultValue);

	public flatMap = <U>(f: (v: T) => Maybe<U>): Maybe<U> => none();

	public join = (): null => null;

	public filter = (f: (v: T) => boolean): Maybe<T> => this;

	public filterType = <U extends T = T>(f: (v: T) => v is U): Maybe<U> =>
		(this as unknown) as None<U>;

	public cata = <U>(nf: () => U, f: (v: T) => U): U => nf();

	public chain = <U>(f: (v: T) => U): U | null => this.map(f).join();

	public toEither = <L>(defaultLeft: L): Either<L, T> => left(defaultLeft);

	public ap = <U>(fn: Maybe<(v: T) => U>): Maybe<U> => none();

	public orElseRun = (fn: () => void): void => fn();

	public orNoneIf = (beNone: boolean): Maybe<T> => none();

	public orNull = () => null;

	public some = (): never => {
		throw new Error('Called orSome on None');
	};

	public orSome = (value: T): T => value;

	public fold = <U>(value: U): ((f: (v: T) => U) => U) => () => value;
}

export const just = <T>(value: T | Maybe<T>): Maybe<T> =>
	value instanceof Just || value instanceof None ? value : new Just(value);

export const none = <T>(): Maybe<T> => new None();

export const fromValue = <T>(value?: T | Maybe<T> | undefined | null): Maybe<T> =>
	value === undefined || value === null ? none() : just(value);

export const maybe = <T>(obj: MaybeObj<T>): Maybe<T> => (obj.hasValue ? just(obj.value) : none());

export const get = <T, K extends keyof T = keyof T>(prop: K) => (obj: T): T[K] => obj[prop];

export const isSomething = <T>(value: Maybe<T>): value is Just<T> => value.hasValue;

export const isNothing = <T>(value: Maybe<T>): value is None<T> => !value.hasValue;

export const asObj = <T>(value: MaybeObj<T>): MaybeObj<T> =>
	value.hasValue
		? ({
				hasValue: true,
				value: value.value
		  } as JustObj<T>)
		: ({
				hasValue: false
		  } as NoneObj<T>);
