/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { AsyncEither, asyncRight } from '../lib/AsyncEither';
import { Either, EitherObj } from '../lib/Either';
import {
	api,
	APIEither,
	APIEndpoint,
	APIEndpointBody,
	APIEndpointParams,
	APIEndpointReturnValue,
	HTTPError,
} from '../typings/api';

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

const getToken = (fetchFunction: FetchFunction): AsyncEither<HTTPError, string> =>
	asyncRight(
		fetchFunction(`/api/token`, {
			credentials: 'include',
			headers: {
				accept: 'application/json',
			},
		}),
		errorGenerator('Could not get token'),
	).flatMap(resp => resp.json() as Promise<APIEndpointReturnValue<api.FormToken>>);

export default (fetchFunction: FetchFunction) => <
	T extends APIEndpoint<string, any, any, any, any, any, any>
>(
	values: Pick<T, 'url' | 'method' | 'requiresMember' | 'needsToken'> & { paramKeys: string[] },
): ((
	params: APIEndpointParams<T>,
	body: APIEndpointBody<T>,
) => AsyncEither<HTTPError, APIEndpointReturnValue<T>>) => {
	let mutatedUrl = values.url;
	for (const key of values.paramKeys) {
		const match = mutatedUrl.match(new RegExp(`/:${key}\\??(/|$)`, 'g'));
		if (!match || match.length !== 1) {
			throw new Error(
				`Invalid key in URL ${(values.method as string).toUpperCase()} ${
					values.url
				}: ${key}`,
			);
		}

		mutatedUrl = mutatedUrl.replace(new RegExp(`:${key}\\??`), '');
	}

	if (mutatedUrl.includes(':')) {
		const regex = /:(.*?)(\/|$)/g;
		const unusedKeys: string[] = [];

		let m;
		while ((m = regex.exec(mutatedUrl)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}

			unusedKeys.push(m[1]);
		}

		throw new Error(
			`Keys remaining in URL ${(values.method as string).toUpperCase()} ${
				values.url
			}: '${unusedKeys.join("', '")}'`,
		);
	}

	const urlReplacer = (url: string) => (params: APIEndpointParams<T>): string => {
		let newURL = url;
		for (const param in params) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			if (params.hasOwnProperty(param)) {
				newURL = newURL.replace(new RegExp(`:${param}\\??`), params[param]);
			}
		}

		newURL = newURL.replace(/:\w*\?/g, '');

		return newURL;
	};

	const customURLReplacer = urlReplacer(values.url);

	return (
		params: APIEndpointParams<T>,
		body: APIEndpointBody<T>,
	): AsyncEither<HTTPError, APIEndpointReturnValue<T>> =>
		(values.needsToken
			? getToken(fetchFunction)
			: asyncRight<HTTPError, undefined | string>(
					undefined,
					errorGenerator('Could not get token'),
			  )
		)
			.map<RequestInit>(token =>
				(values.method as string).toUpperCase() === 'GET'
					? {}
					: token
					? {
							headers: {
								'content-type': 'application/json',
								'accept': 'application/json',
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
								'accept': 'application/json',
							},
							body: JSON.stringify(body),
							method: values.method,
					  }
					: {},
			)
			.map<RequestInit>(request => ({
				...request,
				credentials: 'include',
			}))
			.map(
				request => fetchFunction(customURLReplacer(params), request),
				errorGenerator('Could not complete request'),
			)
			.flatMap(response =>
				response.status === 204
					? Either.right(void 0 as APIEndpointReturnValue<T>)
					: (response.json.apply(response) as Promise<
							APIEither<APIEndpointReturnValue<T>>
					  >),
			);
};
