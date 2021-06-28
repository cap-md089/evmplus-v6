import type {
	AccountObject,
	ActiveSession,
	APIEither,
	APIEndpoint,
	APIEndpointBody,
	APIEndpointMember,
	APIEndpointMethod,
	APIEndpointParams,
	APIEndpointReturnValue,
	APIEndpointToken,
	APIEndpointURL,
	APIEndpointUsesValidator,
	AsyncEither,
	AsyncIter,
	BasicMySQLRequest,
	EitherObj,
	HTTPError,
	MaybeObj,
	MemberRequirement,
	ServerError,
	User,
	Validator,
	ValidatorImpl,
} from 'common-lib';

export type SessionID<
	Endpoint extends APIEndpoint<string, any, any, any, any, any, any>
> = APIEndpointToken<Endpoint> extends true
	? string
	: APIEndpointMember<Endpoint> extends 'unused'
	? never
	: APIEndpointMember<Endpoint> extends 'required'
	? string
	: string | undefined;

type EndpointFunc<T extends APIEndpoint<string, any, any, any, any, any, any>, R> = (
	values: Pick<T, 'url' | 'method' | 'requiresMember' | 'needsToken'> & { paramKeys: string[] },
) => (params: APIEndpointParams<T>, body: APIEndpointBody<T>, sessionID: SessionID<T>) => R;

export type EitherReturn<R> = [R] extends [EitherObj<infer Left, infer Right>]
	? AsyncEither<Left, Right>
	: never;

export function apiCall<
	T extends APIEndpoint<string, any, any, any, any, any, any>,
	R = EitherReturn<APIEndpointReturnValue<T>>
>(
	endpointFunc: EndpointFunc<T, R>,
): (params: APIEndpointParams<T>, body: APIEndpointBody<T>, sessionID: SessionID<T>) => R;

interface APIInfo {
	[key: string]: APIInfo | APIEndpoint<string, any, any, any, any, any, any, any>;
}

type APITree<T extends APIInfo> = {
	[P in keyof T]: T[P] extends APIEndpoint<string, any, any, any, any, any, any, any>
		? (
				params: APIEndpointParams<T[P]>,
				body: APIEndpointBody<T[P]>,
		  ) => APIEndpointReturnValue<T[P]> extends APIEither<infer R>
				? AsyncEither<HTTPError, R>
				: never
		: T[P] extends APIInfo
		? APITree<T[P]>
		: never;
};

export function generateAPITree<T extends APIInfo>(
	endpointFunc: EndpointFunc<any, any>,
): APITree<T>;

export function apiURL<
	T extends APIEndpoint<string, any, any, any, any, any, any>
>(): APIEndpointURL<T>;

export function validator<T>(validatorConstructor: typeof Validator): ValidatorImpl<T>;

export type RequestType<P, B, M extends MemberRequirement> = Omit<
	BasicMySQLRequest,
	'params' | 'body'
> & { account: AccountObject } & {
	params: P;
} & { body: B } & (M extends 'optional'
		? { member: MaybeObj<User>; session: MaybeObj<ActiveSession> }
		: M extends 'required'
		? { member: User; session: ActiveSession }
		: // eslint-disable-next-line @typescript-eslint/ban-types
		  {});

export type APIRequest<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = RequestType<APIEndpointParams<T>, APIEndpointBody<T>, APIEndpointMember<T>>;

export type ServerEither<T> = AsyncEither<ServerError, T>;

export type ReturnValue<Return extends APIEither<any>> = [Return] extends [
	EitherObj<any, infer Right>,
]
	? Right extends Array<infer ArrayItem>
		? ServerEither<Right> | ServerEither<AsyncIter<ArrayItem>>
		: ServerEither<Right>
	: never;

export type ServerAPIEndpoint<
	T extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>
> = (req: ServerAPIRequestParameter<T>) => ServerAPIReturnValue<T>;

export type ServerAPIRequestParameter<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = RequestType<
	APIEndpointParams<T>,
	APIEndpointUsesValidator<T> extends true ? APIEndpointBody<T> : unknown,
	APIEndpointMember<T>
>;

export type ServerAPIReturnValue<
	T extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>
> = T extends APIEndpoint<string, APIEither<infer Right>, any, any, any, any, any, any>
	? ServerEither<{
			response: AsyncRepr<Right>;
			cookies: Record<
				string,
				{
					expires: number;
					value: string;
				}
			>;
	  }>
	: never;

export type AsyncRepr<T> = [T] extends [Array<infer ArrayItem>]
	? T | AsyncIter<ArrayItem> | PromiseLike<T>
	: T extends APIEither<infer R>
	? // eslint-disable-next-line @typescript-eslint/ban-types
	  T | PromiseLike<R> | R extends {}
		? PromiseLike<
				{
					[P in keyof R]: AsyncRepr<R[P]>;
				}
		  >
		: never
	: // eslint-disable-next-line @typescript-eslint/ban-types
	T extends {}
	?
			| {
					[P in keyof T]: AsyncRepr<T[P]>;
			  }
			| PromiseLike<
					{
						[P in keyof T]: AsyncRepr<T[P]>;
					}
			  >
	: T | PromiseLike<T>;

export function addAPI<T extends APIEndpoint<string, any, any, any, any, any, any, any>>(
	validatorConstructor: typeof Validator,
	adder: (
		url: APIEndpointURL<T>,
		method: APIEndpointMethod<T>,
		memberRequirement: APIEndpointMember<T>,
		tokenRequired: APIEndpointToken<T>,
		usesValidator: APIEndpointUsesValidator<T>,
		validator: ValidatorImpl<APIEndpointBody<T>>,
	) => (endpoint: ServerAPIEndpoint<T>) => void,
	endpoint: ServerAPIEndpoint<T>,
): void;
