import { AsyncMaybe } from './AsyncMaybe';
import { Either, left, right } from './Either';

export const isPromise = (v: any): v is Promise<any> => !!v && !!v.then;

export class AsyncEither<L, R> {
	public static Left = <L, R>(value: L) =>
		new AsyncEither<L, R>(Promise.resolve(left<L, R>(value)), value);

	public static Right = <L, R>(value: R | Promise<R>, errorValue: L | ((err: Error) => L)) => {
		return new AsyncEither<L, R>(
			isPromise(value)
				? value.then(
						v => right<L, R>(v),
						err => left(typeof errorValue === 'function' ? (errorValue as (err: Error) => L)(err) : errorValue)
				  )
				: Promise.resolve(right<L, R>(value)),
			errorValue
		);
	};

	public constructor(
		public readonly value: Promise<Either<L, R>>,
		public readonly errorValue: L | ((err: Error) => L)
	) {}

	public isLeft = (): Promise<boolean> =>
		this.value.then(
			eith => eith.isLeft(),
			() => true
		);

	public isRight = (): Promise<boolean> => this.value.then(eith => eith.isRight());

	public leftMap = <L2>(
		f: (val: L) => L2,
		errorValue: L2 | ((err: Error) => L2)
	): AsyncEither<L2, R> =>
		new AsyncEither(
			this.value
				.then(val => 
					val.isLeft()
						? Promise.resolve(f(val.value as L)).then(v => left<L2, R>(v))
						: Promise.resolve((val as any) as Either<L2, R>)),
			errorValue
		)

	public map = <R2>(
		f: (val: R) => Promise<R2> | R2,
		errorValue = this.errorValue
	): AsyncEither<L, R2> =>
		new AsyncEither(
			this.value
				.then(val =>
					val.isRight()
						? Promise.resolve(f(val.value as R)).then(v => right<L, R2>(v))
						: Promise.resolve((val as any) as Either<L, R2>)
				)
				.catch(err =>
					left<L, R2>(
						typeof errorValue === 'function'
							? (errorValue as (err: Error) => L)(err)
							: errorValue
					)
				),
			errorValue
		);

	public flatMap = <R2>(
		f: (val: R) => Either<L, R2> | AsyncEither<L, R2>,
		errorValue = this.errorValue
	): AsyncEither<L, R2> =>
		new AsyncEither(
			this.value
				.then(eith => eith.cata(error => asyncLeft<L, R2>(error), val => {
					const newEith = f(val);

					if (newEith instanceof AsyncEither) {
						return newEith;
					} else {
						return new AsyncEither(Promise.resolve(newEith), errorValue);
					}
				}))
				.then(val => val.value)
				.catch(err =>
					left<L, R2>(
						typeof errorValue === 'function'
							? (errorValue as (err: Error) => L)(err)
							: errorValue
					)
				),
			errorValue
		);

	public toSome = (): AsyncMaybe<R> =>
		AsyncMaybe.Maybe(
			this.value
				.then(eith =>
					eith.cata(
						() => null,
						val => val
					)
				)
				.catch(() => null)
		);

	public join = (): Promise<Either<L, R>> => this.value;

	public fullJoin = (): Promise<R> =>
		this.value.then(eith =>
			eith.cata(
				l => Promise.reject(l),
				r => Promise.resolve(r)
			)
		);

	public cata = <T>(lf: (v: L) => Promise<T> | T, rf: (v: R) => Promise<T> | T): Promise<T> =>
		this.value.then(eith => eith.cata(lf, rf));

	public tap = (
		rf: (v: R) => Promise<void> | Promise<any> | void | any,
		errorValue = this.errorValue
	): AsyncEither<L, R> =>
		new AsyncEither(
			this.value
				.then(eith =>
					eith.cata(
						() => Promise.resolve(eith),
						r => Promise.resolve(rf(r)).then(() => eith)
					)
				)
				.catch(err =>
					left<L, R>(
						typeof errorValue === 'function'
							? (errorValue as (err: Error) => L)(err)
							: errorValue
					)
				),
			errorValue
		);
}

export const asyncLeft = AsyncEither.Left;
export const asyncRight = AsyncEither.Right;
