/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { EitherObj } from '../lib/Either';
import { ValidatorFail } from '../lib/Validator';
import * as api from './apis';

export interface HTTPError {
	code: number;
	message: any;
}

export interface ErrorBase {
	code: number;
	type: string;
}

export interface ValidatorError extends ErrorBase {
	type: 'VALIDATOR';
	code: 400;
	message: string;
	validatorState: ValidatorFail;
}

export interface Crash extends ErrorBase {
	type: 'CRASH';
	code: 500;
	error: Error;
	message: string;
}

export interface GenericError extends ErrorBase {
	type: 'OTHER';
	code: number;
	message: string;
}

export type ServerError = Crash | GenericError | ValidatorError;

export type APIEither<T> = EitherObj<HTTPError, T>;

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type MemberRequirement = 'required' | 'optional' | 'unused';

/**
 * An interface which defines how each URL is documented
 *
 * The idea is that each interface holds all information necessary
 * to perform a request
 */
export interface APIEndpoint<
	URL extends string,
	Return extends APIEither<any>,
	Params extends { [key: string]: string },
	Body extends object,
	Method extends HTTPMethod,
	RequiresMember extends MemberRequirement,
	NeedsToken extends boolean = Method extends 'get' ? false : true,
	UseValidator extends boolean = false
> {
	(params: Params, body: Body): Return;

	url: URL;

	method: Method;

	requiresMember: RequiresMember;

	needsToken: NeedsToken;

	useValidator: UseValidator;
}

export type APIEndpointURL<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<infer U, any, any, any, any, any, any, any> ? U : never;
export type APIEndpointReturnValue<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, infer R, any, any, any, any, any, any> ? R : never;
export type APIEndpointParams<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, infer P, any, any, any, any, any> ? P : never;
export type APIEndpointBody<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, any, infer B, any, any, any, any> ? B : never;
export type APIEndpointEffectiveBody<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, any, infer B, any, any, infer Token, any>
	? Token extends true
		? B & { token: string }
		: B
	: never;
export type APIEndpointMethod<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, any, any, infer M, any, any, any> ? M : never;
export type APIEndpointMember<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, any, any, any, infer M, any, any> ? M : never;
export type APIEndpointToken<
	T extends APIEndpoint<string, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, any, any, any, any, infer Token, any>
	? Token extends true
		? true
		: false
	: never;
export type APIEndpointUsesValidator<
	T extends APIEndpoint<any, any, any, any, any, any, any, any>
> = T extends APIEndpoint<any, any, any, any, any, any, any, infer ValidatorUse>
	? ValidatorUse
	: never;

export type { api };

export const errorGenerator = (msg?: string) => (error: Error): ServerError => ({
	type: 'CRASH',
	code: 500,
	error,
	message: msg || error.message,
});
