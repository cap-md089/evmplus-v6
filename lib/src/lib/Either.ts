import { Maybe, none, just } from "./Maybe";

export type EitherObj<L, R> = LeftObj<L> | RightObj<R>;

export interface LeftObj<L> {
	direction: 'left';

	value: L;
}

export interface RightObj<R> {
	direction: 'right';

	value: R;
}

export type Either<L, R> = Left<L> | Right<R>;

export class Left<L> implements LeftObj<L> {
	public readonly direction = 'left' as const;

	constructor(public readonly value: L) {}

	public isLeft = () => true;
	
	public isRight = () => false;

	public map = <R1, R2>(f: (val: R1) => R2): Either<L, R2> => this;

	public flatMap = <R1, R2>(f: (val: R1) => Either<L, R2>): Either<L, R2> => this;

	public toSome = <R>(): Maybe<R> => none();

	public cata = <R, T>(lf: (v: L) => T, rf: (v: R) => T): T => lf(this.value);
}

export class Right<R> implements RightObj<R> {
	public readonly direction = 'right' as const;

	constructor(public readonly value: R) {}

	public isLeft = () => false;

	public isRight = () => true;

	public map = <L, R2>(f: (val: R) => R2): Either<L, R2> => new Right(f(this.value));

	public flatMap = <L, R2>(f: (val: R) => Either<L, R2>): Either<L, R2> => f(this.value);

	public toSome = (): Maybe<R> => just(this.value);

	public cata = <L, T>(lf: (v: L) => T, rf: (v: R) => T): T => rf(this.value);
}

export const left = <R, L>(value: L): Either<L, R> => new Left(value);

export const right = <L, R>(value: R): Either<L, R> => new Right(value);

export const fromObj = <L, R>(value: EitherObj<L, R>): Either<L, R> =>
	value.direction === 'left' ? left(value.value) : right(value.value);