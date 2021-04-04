/**
 * Copyright (C) 2021 Andrew Rioux
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

import { ServerAPIEndpoint } from 'auto-client-api';
import { APIEither, APIEndpoint, asyncLeft, BasicMySQLRequest, ServerError } from 'common-lib';
import { BasicAccountRequest } from '.';

export const notImplementedError = <T>(funcName: string) =>
	asyncLeft<ServerError, T>({
		type: 'OTHER',
		code: 400,
		message: `Function '${funcName}' not implemented`,
	});

export type Backends<T extends any[]> = T extends [infer B, ...infer R] ? B & Backends<R> : {};

export type BackedServerAPIEndpoint<
	B extends any,
	A extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>
> = (backends: B) => ServerAPIEndpoint<A>;

type BackendProviderResult<T extends ((req: any) => any)[]> = T extends [
	(req: any) => infer B,
	...infer R
]
	? B & (R extends ((req: any) => any)[] ? BackendProviderResult<R> : {})
	: {};

export const combineBackends = <R extends BasicMySQLRequest, U extends ((req: R) => any)[]>(
	req: R,
	...backendAdders: U
): BackendProviderResult<U> => {
	let backend: any = {};

	for (const backendAdder of backendAdders) {
		backend = {
			...backend,
			...backendAdder(req as R),
		};
	}

	return backend;
};

export const withBackends = <
	// Use BasicAccountRequest because API.ts forces all requests to have an Account through
	// the use of accountRequestTransformer, which ensures a BasicAccountRequest
	R extends BasicAccountRequest,
	E extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>,
	B extends any,
	F extends BackedServerAPIEndpoint<B, E>,
	U extends ((req: R) => any)[]
>(
	func: F,
	...backendAdders: U
): ServerAPIEndpoint<E> => {
	return (req => {
		let backend: any = (req as any).backend ?? {};

		for (const backendAdder of backendAdders) {
			backend = {
				...backendAdder(req as R),
				...backend,
			};
		}

		return func(backend)(req);
	}) as ServerAPIEndpoint<E>;
};

export interface TimeBackend {
	now: () => number;
}

export const getTimeBackend = () => ({
	now: Date.now,
});
