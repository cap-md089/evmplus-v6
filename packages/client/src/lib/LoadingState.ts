import { Either, EitherObj } from 'common-lib';

interface Loading {
	state: 'Loading';
}

interface Loaded<T> {
	state: 'Loaded';

	value: T;
}

interface StateError<E> {
	state: 'Error';

	error: E;
}

export type LoadingStateObj<T, E> = Loading | Loaded<T> | StateError<E>;

export class LoadingState {
	public static loading = (): Loading => ({
		state: 'Loading',
	});

	public static load = <T>(value: T): Loaded<T> => ({
		state: 'Loaded',
		value,
	});

	public static error = <E>(error: E): StateError<E> => ({
		state: 'Error',
		error,
	});

	public static fromEither = <T, E>(value: EitherObj<E, T>): LoadingStateObj<T, E> =>
		Either.isRight(value)
			? { state: 'Loaded', value: value.value }
			: { state: 'Error', error: value.value };

	public static map = <T, T2, E>(
		value: LoadingStateObj<T, E>,
		func: (val: T) => T2,
	): LoadingStateObj<T2, E> =>
		value.state === 'Loaded' ? { state: 'Loaded', value: func(value.value) } : value;

	public static errorMap = <T, E, E2>(
		value: LoadingStateObj<T, E>,
		func: (val: E) => E2,
	): LoadingStateObj<T, E2> =>
		value.state === 'Error' ? { state: 'Error', error: func(value.error) } : value;

	public static match = <T, E, V>(
		value: LoadingStateObj<T, E>,
		matchers: {
			Loading: () => V;
			Loaded: (value: T) => V;
			Error: (err: E) => V;
		},
	): V =>
		value.state === 'Error'
			? matchers.Error(value.error)
			: value.state === 'Loaded'
			? matchers.Loaded(value.value)
			: matchers.Loading();
}

export default LoadingState;
