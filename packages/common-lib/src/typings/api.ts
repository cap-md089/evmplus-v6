/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file and all of the files in `apis` document how to communicate
 * with the server.  All of these expect to be run from a browser; this means that
 * a host header is expected to be set with the format `${accountID}.capunit.com`
 *
 * Each interface defines:
 * 	- The URL parameters and where in the URL it is to be located
 * 		(e.g:
 * 			with params: { id: string }
 * 			and url: '/api/event/:id'
 * 			get event 1 with the URL '/api/event/1'
 * 		)
 *  - The request body (JSON formatted, empty if body is {})
 * 	- The return body (JSON formatted)
 * 	- The HTTP method
 * 	- Whether or not a member is used in the request
 * 		- 'unused': Having a member doesn't change anything
 * 		- 'optional': Having a member will produce different output
 * 			than not having a member
 * 		- 'requred': Returns 403 if a member session is not provided
 *
 * 		To use a member session, set the 'authorization' header to
 * 			be the session ID
 * 	- Whether or not a token is needed
 * 		If it is needed, a `token` property needs to be added to the request body
 * 		A token can be fetched from '/api/token', and is valid for one use
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

/**
 * Contains the HTTP status code that will be reflected and also a message
 * detailing what has happened
 */
export interface HTTPError {
	code: number;
	message: any;
}

/**
 * Basic error information shared across all error objects
 */
export interface ErrorBase {
	code: number;
	type: string;
}

/**
 * Records when a user has failed to provide the correct input to call an API
 */
export interface ValidatorError extends ErrorBase {
	type: 'VALIDATOR';
	code: 400;
	message: string;
	validatorState: ValidatorFail;
}

/**
 * Used to record when the server crashes
 */
export interface Crash extends ErrorBase {
	type: 'CRASH';
	code: 500;
	error: Error;
	message: string;
}

/**
 * Used for cases like user error. Just not a crash or user input shape error
 */
export interface GenericError extends ErrorBase {
	type: 'OTHER';
	message: string;
}

/**
 * These are the different types of errors that the server may generate
 */
export type ServerError = Crash | GenericError | ValidatorError;

/**
 * Shortcut type to document what is returned from APIs
 */
export type APIEither<T> = EitherObj<HTTPError, T>;

/**
 * The different HTTP methods expected to be used
 */
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
	Params extends { [key: string]: string | undefined },
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

//
// Convenience types to extract information from an API endpoint interface
//

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
