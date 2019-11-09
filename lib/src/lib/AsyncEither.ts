import { AsyncMaybe } from './AsyncMaybe';
import { Either, left, right } from './Either';

export const isPromise = (v: any): v is Promise<any> => !!v && !!v.then;

export class AsyncEither<L, R> {
	public static Left = <L, R>(value: L) =>
		new AsyncEither<L, R>(Promise.resolve(left<L, R>(value)), value);

	public static Right = <L, R>(value: R | Promise<R>, errorValue: L) => {
		return new AsyncEither<L, R>(
			isPromise(value)
				? value.then(v => right<L, R>(v), () => left(errorValue))
				: Promise.resolve(right<L, R>(value)),
			errorValue
		);
	};

	public constructor(
		public readonly value: Promise<Either<L, R>>,
		public readonly errorValue: L
	) {}

	public isLeft = (): Promise<boolean> => this.value.then(eith => eith.isLeft(), () => true);

	public isRight = (): Promise<boolean> => this.value.then(eith => eith.isRight());

	public map = <R2>(
		f: (val: R) => Promise<R2> | R2,
		errorValue: L = this.errorValue
	): AsyncEither<L, R2> =>
		new AsyncEither(
			this.value
				.then(val =>
					val.isRight()
						? Promise.resolve(f(val.value as R)).then(v => right<L, R2>(v))
						: Promise.resolve((val as any) as Either<L, R2>)
				)
				.catch(() => left<L, R2>(errorValue)),
			this.errorValue
		);

	public flatMap = <R2>(f: (val: R) => AsyncEither<L, R2>): AsyncEither<L, R2> =>
		new AsyncEither(
			this.value
				.then(val => val.cata(error => asyncLeft<L, R2>(error), f))
				.then(val => val.value)
				.catch(() => left<L, R2>(this.errorValue)),
			this.errorValue
		);

	public toSome = (): AsyncMaybe<R> =>
		AsyncMaybe.Maybe(
			this.value.then(eith => eith.cata(() => null, val => val)).catch(() => null)
		);

	public cata = <T>(lf: (v: L) => Promise<T> | T, rf: (v: R) => Promise<T> | T): Promise<T> =>
		this.value.then(eith => eith.cata(lf, rf));

	public tap = (
		rf: (v: R) => Promise<void> | void,
		errorValue: L = this.errorValue
	): AsyncEither<L, R> =>
		new AsyncEither(
			this.value
				.then(eith =>
					eith.cata(
						() => Promise.resolve(eith),
						r => Promise.resolve(rf(r)).then(() => eith)
					)
				)
				.catch(() => left<L, R>(errorValue)),
			this.errorValue
		);
}

export const asyncLeft = AsyncEither.Left;
export const asyncRight = AsyncEither.Right;
