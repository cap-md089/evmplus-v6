import { AsyncEither } from './AsyncEither';
import { fromValue, Maybe, none } from './Maybe';

const isNone = (v: any): v is undefined | null => v === undefined || v === null;

export class AsyncMaybe<T> {
	public static Just = <T>(v: Promise<T> | T): AsyncMaybe<T> =>
		new AsyncMaybe(Promise.resolve(v));

	public static None = <T>(): AsyncMaybe<T> => new AsyncMaybe(Promise.resolve<T | null>(null));

	public static Maybe = <T>(v: Promise<T | null> | T | null): AsyncMaybe<T> =>
		new AsyncMaybe(Promise.resolve(v));

	private constructor(public readonly value: Promise<T | null>) {}

	public map = <U>(fn: (v: T) => Promise<U> | U): AsyncMaybe<U> =>
		new AsyncMaybe(
			this.value
				.then(v => (isNone(v) ? Promise.resolve(null) : Promise.resolve(fn(v))))
				.catch(() => Promise.resolve(null))
		);

	public flatMap = <U>(fn: (v: T) => AsyncMaybe<U>): AsyncMaybe<U> =>
		new AsyncMaybe(
			this.value
				.then(v => (isNone(v) ? new AsyncMaybe(Promise.resolve(null)) : fn(v)))
				.catch(() => Promise.resolve(null))
		);

	public orElse = (defaultValue: T | Promise<T>): AsyncMaybe<T> =>
		new AsyncMaybe(
			this.value
				.then(val => (isNone(val) ? defaultValue : val))
				.catch(() => Promise.resolve(null))
		);

	public join = (): Promise<T | null> => this.value;

	public maybe = (): Promise<Maybe<T>> =>
		this.value.then(v => fromValue(v)).catch(v => none<T>());

	public filter = (fn: (v: T) => boolean): AsyncMaybe<T> =>
		new AsyncMaybe(
			this.value
				.then(val => (isNone(val) || !fn(val) ? null : val))
				.catch(() => Promise.resolve(null))
		);

	public chain = <U>(fn: (v: T) => Promise<U> | U): Promise<U | null> => this.map(fn).join();

	public cata = <U>(nf: () => Promise<U> | U, vf: (v: T) => Promise<U> | U): Promise<U> =>
		this.maybe().then(m => m.cata(nf, vf));

	public tap = (fn: (v: T) => Promise<void> | void): AsyncMaybe<T> =>
		new AsyncMaybe(
			this.value
				.then(val =>
					isNone(val) ? Promise.resolve(null) : Promise.resolve(fn(val)).then(() => val)
				)
				.catch(() => Promise.resolve(null))
		);

	public isSome = (): Promise<boolean> => this.value.then(v => !isNone(v)).catch(v => false);

	public isNone = (): Promise<boolean> => this.value.then(v => isNone(v)).catch(v => true);

	public toEither = <L>(defaultValue: L): AsyncEither<L, T> =>
		new AsyncEither(this.maybe().then(maybe => maybe.toEither(defaultValue)), defaultValue);

	public then = <TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
	): PromiseLike<TResult1 | TResult2> => this.value.then(onfulfilled, onrejected);
}

export const MaybePromise = AsyncMaybe;
export const asyncJust = AsyncMaybe.Just;
export const asyncNone = AsyncMaybe.None;
