export type EitherObj<L, R> = Left<L> | Right<R>;

export interface Left<L> {
	direction: 'left';

	value: L;
}

export interface Right<R> {
	direction: 'right';

	value: R;
}

export class Either {
	public static left = <L, R>(value: L): Left<L> => ({ direction: 'left', value });

	public static right = <L, R>(value: R): Right<R> => ({ direction: 'right', value });

	public static isLeft = <L, R>(v: EitherObj<L, R>): v is Left<L> => v.direction === 'left';

	public static isRight = <L, R>(v: EitherObj<L, R>): v is Right<R> => v.direction === 'right';

	public static leftMap = <L, L2, R>(f: (val: L) => L2) => (eith: EitherObj<L, R>) =>
		Either.isLeft(eith) ? Either.left(f(eith.value)) : eith;

	public static map = <L, R, R2>(f: (val: R) => R2) => (eith: EitherObj<L, R>) =>
		Either.isRight(eith) ? Either.right(f(eith.value)) : eith;

	public static flatMap = <L, R, R2>(f: (val: R) => EitherObj<L, R2>) => (
		eith: EitherObj<L, R>
	) => (Either.isRight(eith) ? f(eith.value) : eith);

	public static cata = <L, R, T>(lf: (v: L) => T) => (rf: (v: R) => T) => (
		eith: EitherObj<L, R>
	) => (Either.isRight(eith) ? rf(eith.value) : lf(eith.value));

	public static filter = <L, R>(predicate: (val: R) => boolean) => (filterError: L) =>
		Either.cata<L, R, EitherObj<L, R>>(Either.left)(right =>
			predicate(right) ? Either.right(right) : Either.left(filterError)
		);

	public static filterType = <L, R, S extends R>(predicate: (val: R) => val is S) => (
		filterError: L
	) =>
		Either.cata<L, R, EitherObj<L, S>>(Either.left)(right =>
			predicate(right) ? Either.right(right) : Either.left(filterError)
		);

	public static isValidEither = (value: any): value is EitherObj<any, any> =>
		'direction' in value &&
		'value' in value &&
		(value.direction === 'right' || value.direction === 'left');
}
