/**
 * Copyright (C) 2021 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ServerAPIEndpoint, ServerEither } from 'auto-client-api';
import { APIEither, APIEndpoint, asyncLeft, asyncRight, errorGenerator } from 'common-lib';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { v4 as uuid } from 'uuid';
import { BasicAccountRequest } from './Account';

export const notImplementedError = <T>(funcName: string): ServerEither<T> =>
	asyncLeft({
		type: 'OTHER',
		code: 400,
		message: `Function '${funcName}' not implemented`,
	});

export class NotImplementedException extends Error {
	public constructor(public readonly functionName: string) {
		super(`Function ${functionName} not implemented`);
	}
}

export const notImplementedException = (funcName: string): never => {
	throw new NotImplementedException(funcName);
};

export type Backends<T extends any[]> = T extends [infer B, ...infer R] ? B & Backends<R> : {};

export type BackedServerAPIEndpoint<
	B extends any,
	A extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>
> = (backends: B) => ServerAPIEndpoint<A>;

type BackendProviders<Request, ProvidedBackends extends any[], CurrentBackend extends {} = {}> = {
	recurse: ProvidedBackends extends [infer Current, ...infer Rest]
		? [
				(req: Request, current: CurrentBackend) => Current,
				...BackendProviders<Request, Rest, Current & CurrentBackend>
		  ]
		: never;
	base: [];
}[ProvidedBackends extends [] ? 'base' : 'recurse'];

export const combineBackends = <R, U extends any[]>(
	...backendAdders: BackendProviders<R, U>
): ((req: R) => Backends<U>) => req => {
	let backend: any = {};

	for (const backendAdder of backendAdders as any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		backend = {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			...backendAdder(req, backend),
			...backend,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return backend;
};

export const withBackends = <
	// Use BasicAccountRequest because API.ts forces all requests to have an Account through
	// the use of accountRequestTransformer, which ensures a BasicAccountRequest
	E extends APIEndpoint<string, APIEither<any>, any, any, any, any, any, any>,
	R extends BasicAccountRequest,
	F extends BackedServerAPIEndpoint<any, E>
>(
	func: F,
	backendGenerator: (req: R) => F extends BackedServerAPIEndpoint<infer B, E> ? B : never,
): ReturnType<F> => (req => func(backendGenerator(req as R))(req)) as ReturnType<F>;

export interface TimeBackend {
	now: () => number;
}

export const getTimeBackend = (): TimeBackend => ({
	now: Date.now,
});

export interface RandomBackend {
	randomBytes: (length: number) => ServerEither<Buffer>;
	randomNumber: () => number;
	uuid: () => string;
}

export const getRandomBackend = (): RandomBackend => ({
	randomBytes: length =>
		asyncRight(
			promisify(randomBytes)(length),
			errorGenerator('Could not generate random bytes'),
		),
	randomNumber: () => Math.random(),
	uuid: () => uuid(),
});

export const getEmptyRandomBackend = (): RandomBackend => ({
	randomBytes: () => notImplementedError('randomBytes'),
	randomNumber: () => notImplementedException('randomNumber'),
	uuid: () => notImplementedException('uuid'),
});

export type GenBackend<BackendGenerator extends (req: any) => any> = BackendGenerator extends (
	req: any,
) => infer Backend
	? Backend
	: never;
