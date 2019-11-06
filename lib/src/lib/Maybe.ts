import { Either, right, left } from "./Either";

export type MaybeObj<T> = Just<T> | None<T>;

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

	constructor(public readonly value: T) {}

	public isSome = () => true;

	public isNone = () => false;

	public map = <U>(f: (v: T) => U): Maybe<U> => just(f(this.value));

	public orElse = (defaultValue: T): Maybe<T> => this;

	public flatMap = <U>(f: (v: T) => Maybe<U>) => f(this.value);

	public join = (): T => this.value;

	public filter = (f: (v: T) => boolean): Maybe<T> => f(this.value) ? this : none();

	public cata = <U>(nf: () => U, f: (v: T) => U): U => f(this.value);

	public chain = <U>(f: (v: T) => U): U | null => this.map(f).join();

	public toEither = <L>(defaultLeft: L): Either<L, T> => right(this.value);
}

export class None<T> implements NoneObj<T> {
	public readonly hasValue: false = false;

	constructor() {}

	public isSome = () => false;

	public isNone = () => true;

	public map = <U>(f: (v: T) => U): Maybe<U> => none();

	public orElse = (defaultValue: T): Maybe<T> => just(defaultValue);

	public flatMap = <U>(f: (v: T) => Maybe<U>) => none();

	public join = (): null => null;

	public filter = (f: (v: T) => boolean): Maybe<T> => none();

	public cata = <U>(nf: () => U, f: (v: T) => U): U => nf();

	public chain = <U>(f: (v: T) => U): U | null => this.map(f).join();

	public toEither = <L>(defaultLeft: L): Either<L, T> => left(defaultLeft);
}

export const just = <T>(value: T): Maybe<T> => new Just(value);

export const none = <T>(): Maybe<T> => new None();

export const fromValue = <T>(value?: T): Maybe<T> =>
	value === undefined || value === null
		? none()
		: just(value);

export const maybe = <T>(obj: MaybeObj<T>): Maybe<T> =>
	obj.hasValue ? just(obj.value) : none();