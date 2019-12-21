import { AsyncEither } from './AsyncEither';
import { just, Maybe, none } from './Maybe';

export type EitherObj<L, R> = LeftObj<L> | RightObj<R>;

export interface LeftObj<L> {
	direction: 'left';

	value: L;
}

export interface RightObj<R> {
	direction: 'right';

	value: R;
}

export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> implements LeftObj<L> {
	public static Left = <L, R>(value: L): Left<L, R> => new Left(value);

	public readonly direction = 'left' as const;

	private constructor(public readonly value: L) {}

	public isLeft = (): this is Left<L, R> => true;

	public isRight = (): this is Right<L, R> => false;

	public map = <R2>(f: (val: R) => R2): Either<L, R2> => (this as any) as Left<L, R2>;

	public flatMap = <R2>(f: (val: R) => Either<L, R2>): Either<L, R2> =>
		(this as any) as Left<L, R2>;

	public toSome = (): Maybe<R> => none();

	public cata = <T>(lf: (v: L) => T, rf: (v: R) => T): T => lf(this.value);

	public toAsync = (): AsyncEither<L, R> => new AsyncEither(Promise.resolve(this), this.value);

	public toObj = (): LeftObj<L> => ({
		direction: 'left',
		value: this.value
	});
}

export class Right<L, R> implements RightObj<R> {
	public static Right = <L, R>(value: R): Right<L, R> => new Right(value);

	public readonly direction = 'right' as const;

	private constructor(public readonly value: R) {}

	public isLeft = (): this is Left<L, R> => false;

	public isRight = (): this is Right<L, R> => true;

	public map = <R2>(f: (val: R) => R2): Either<L, R2> => new Right(f(this.value));

	public flatMap = <R2>(f: (val: R) => Either<L, R2>): Either<L, R2> => f(this.value);

	public toSome = (): Maybe<R> => just(this.value);

	public cata = <T>(lf: (v: L) => T, rf: (v: R) => T): T => rf(this.value);

	public toAsync = (errorValue: L): AsyncEither<L, R> =>
		new AsyncEither(Promise.resolve(this), errorValue);

	public toObj = (): RightObj<R> => ({
		direction: 'right',
		value: this.value
	});
}

export const left = Left.Left;

export const right = Right.Right;

export const either = <L, R>(value: EitherObj<L, R>): Either<L, R> =>
	value.direction === 'left' ? left(value.value) : right(value.value);
