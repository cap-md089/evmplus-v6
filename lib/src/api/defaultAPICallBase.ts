import { AsyncEither, asyncRight } from '../lib/AsyncEither';
import { EitherObj } from '../lib/Either';
import {
	api,
	APIEither,
	APIEndpoint,
	APIEndpointBody,
	APIEndpointMember,
	APIEndpointParams,
	APIEndpointReturnValue,
	APIEndpointToken,
	HTTPError,
} from '../typings/api';

type SessionID<
	Endpoint extends APIEndpoint<string, any, any, any, any, any, any>
> = APIEndpointToken<Endpoint> extends true
	? string
	: APIEndpointMember<Endpoint> extends 'unused'
	? never
	: APIEndpointMember<Endpoint> extends 'required'
	? string
	: string | undefined;

type FetchFunction = (url: string, options: RequestInit) => Promise<Response>;

export type EitherReturn<
	T extends APIEndpoint<string, any, any, any, any, any, any>
> = APIEndpointBody<T> extends EitherObj<infer Left, infer Right>
	? AsyncEither<Left, Right>
	: never;

const errorGenerator = (message: string) => (error: Error): HTTPError & { error?: Error } => ({
	code: 500,
	message,
	error,
});

const getToken = (fetchFunction: FetchFunction) => (
	authorization: string
): AsyncEither<HTTPError, string> =>
	asyncRight(
		fetchFunction(`/api/token`, {
			headers: {
				authorization,
			},
		}),
		errorGenerator('Could not get token')
	).flatMap(resp => resp.json() as Promise<APIEndpointReturnValue<api.FormToken>>);

export default (fetchFunction: FetchFunction) => <
	T extends APIEndpoint<string, any, any, any, any, any, any>
>(
	values: Pick<T, 'url' | 'method' | 'requiresMember' | 'needsToken'> & { paramKeys: string[] }
) => {
	let mutatedUrl = values.url;
	for (const key of values.paramKeys) {
		const match = mutatedUrl.match(new RegExp(`/:${key}(/|$)`, 'g'));
		if (!match || match.length !== 1) {
			throw new Error(
				`Invalid key in URL ${values.method.toUpperCase()} ${values.url}: ${key}`
			);
		}

		mutatedUrl = mutatedUrl.replace(new RegExp(`:${key}`), '');
	}

	if (mutatedUrl.includes(':')) {
		const regex = /:(.*?)(\/|$)/g;
		const unusedKeys: string[] = [];

		let m;
		// tslint:disable-next-line: no-conditional-assignment
		while ((m = regex.exec(mutatedUrl)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}

			unusedKeys.push(m[1]);
		}

		throw new Error(
			`Keys remaining in URL ${values.method.toUpperCase()} ${values.url}: '${unusedKeys.join(
				"', '"
			)}'`
		);
	}

	const urlReplacer = (url: string) => (params: APIEndpointParams<T>): string => {
		let newURL = url;
		for (const param in params) {
			if (params.hasOwnProperty(param)) {
				newURL = newURL.replace(`:${param}`, params[param]);
			}
		}

		return newURL;
	};

	const customURLReplacer = urlReplacer(values.url);

	return (
		params: APIEndpointParams<T>,
		body: APIEndpointBody<T>,
		sessionID: SessionID<T>
	): AsyncEither<HTTPError, APIEndpointReturnValue<T>> =>
		(values.needsToken
			? (getToken(fetchFunction)(sessionID!) as AsyncEither<HTTPError, undefined | string>)
			: asyncRight<HTTPError, undefined | string>(
					undefined,
					errorGenerator('Could not get token')
			  )
		)
			.map<RequestInit>(token =>
				values.method.toUpperCase() === 'GET'
					? {}
					: token
					? {
							headers: {
								'content-type': 'application/json',
							},
							body: JSON.stringify({
								...(body || {}),
								token,
							}),
							method: values.method,
					  }
					: !!body
					? {
							headers: {
								'content-type': 'application/json',
							},
							body: JSON.stringify(body),
							method: values.method,
					  }
					: {}
			)
			.map<RequestInit>(request => ({
				...request,
				headers: {
					...(request.headers || {}),
					authorization: sessionID ?? '',
				},
			}))
			.map(
				request => fetchFunction(customURLReplacer(params), request),
				errorGenerator('Could not complete request')
			)
			.flatMap(
				response =>
					response.json.apply(response) as Promise<APIEither<APIEndpointReturnValue<T>>>
			);
};