/**
 * Copyright (C) 2020 Andrew Rioux
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

import { AsyncRepr, RequestType, ReturnValue, ServerAPIReturnValue } from 'auto-client-api';
import * as bodyParser from 'body-parser';
import {
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
	asyncRight,
	BasicMySQLRequest,
	Either,
	EitherObj,
	errorGenerator,
	MaybeObj,
	MemberRequirement,
	ParamType,
	ServerError,
	stripProp,
	User,
	ValidatorError,
	ValidatorFail,
	ValidatorImpl,
} from 'common-lib';
import * as debug from 'debug';
import * as express from 'express';
import {
	accountRequestTransformer,
	BasicAccountRequest,
	getCombinedPAMBackend,
	PAM,
	ServerEither,
} from 'server-common';
import { tokenTransformer } from '../api/formtoken';
import saveServerError, { Requests } from './saveServerError';
const logFunc = debug('server:lib:api');

export const addMember = (memberRequirement: MemberRequirement) => <P extends ParamType, B>(
	request: Requests<P, B>,
) => (req: BasicAccountRequest<P, B>): AsyncEither<ServerError, Requests<P, B>> => {
	const tapFunction = (
		newReq: PAM.BasicMemberRequest<P, B> | PAM.BasicMaybeMemberRequest<P, B>,
	): void => {
		(request as { member: User | MaybeObj<User> }).member = newReq.member;
	};

	if (memberRequirement === 'required') {
		logFunc('Member is required in request');
		return PAM.memberRequestTransformer(true)(req).tap(tapFunction);
	} else if (memberRequirement === 'optional') {
		logFunc(
			'Member is optional in request; current auth token/cookie: %s; headers: %o',
			req.headers?.cookie ?? req.headers?.authorization,
			req.headers,
		);
		return PAM.memberRequestTransformer(false)(req).tap(tapFunction);
	} else {
		return asyncRight(req, errorGenerator('Could not handle request'));
	}
};

export const validateBody = <
	T extends APIEndpoint<string, any, any, any, any, any, any>,
	R extends { body: any }
>(
	validator: ValidatorImpl<APIEndpointBody<T>>,
) => (req: R): EitherObj<ServerError, Omit<R, 'body'> & { body: APIEndpointBody<T> }> =>
	Either.map<ServerError, APIEndpointBody<T>, Omit<R, 'body'> & { body: APIEndpointBody<T> }>(
		body => ({
			...req,
			body,
		}),
	)(
		Either.leftMap<ValidatorFail, ValidatorError, APIEndpointBody<T>>(validatorState => ({
			type: 'VALIDATOR',
			code: 400,
			message: 'There was a problem with the request body',
			validatorState,
		}))(validator.validate(req.body, 'request body')),
	);

type Sender<T> = (request: Requests) => (response: express.Response) => (value: T) => Promise<void>;

const sendIter: Sender<AsyncIter<any>> = request => response => async value => {
	let dataWritten = false;

	response.write('[');

	for await (const i of value) {
		if (dataWritten) {
			response.write(',');
		}

		await send(request)(response)(i);

		dataWritten = true;
	}

	response.write(']');
};

const sendEither: Sender<EitherObj<ServerError, any>> = request => response => async value => {
	if (value.direction === 'left') {
		const { value: error } = value;
		if (error.type === 'CRASH') {
			await saveServerError(error.error, request);
		}

		response.write('{"direction":"left","value":');
		response.write(JSON.stringify(stripProp('error')(error)));
		response.write('}');
	} else {
		response.write('{"direction":"right","value":');
		await send(request)(response)(value.value);
		response.write('}');
	}
};

const sendObject: Sender<Record<string, unknown> | null> = request => response => async value => {
	if (value === null) {
		response.write('null');
		return;
	}

	response.write('{');
	let dataWritten = false;
	for (const key in value) {
		if (value.hasOwnProperty(key)) {
			if (dataWritten) {
				response.write(',');
			}

			response.write(`"${key}":`);
			await send(request)(response)(value[key]);

			dataWritten = true;
		}
	}
	response.write('}');
};

export const send = (request: Requests) => (response: express.Response) => async (
	value: AsyncRepr<unknown>,
): Promise<void> => {
	const validEither = Either.isValidEither as (e: unknown) => e is EitherObj<ServerError, any>;

	if (value === null || value === undefined) {
		response.write('null');
	} else if (typeof value === 'boolean' || typeof value === 'number') {
		// Handle the undefined case
		response.write(String(value));
	} else if (typeof value === 'string') {
		response.write(JSON.stringify(value));
	} else if (
		typeof value === 'object' &&
		value !== null &&
		(Symbol.asyncIterator in value || Symbol.iterator in value)
	) {
		await sendIter(request)(response)(value as AsyncIter<any>);
	} else if (validEither(value)) {
		await sendEither(request)(response)(value);
	} else if (value instanceof AsyncEither) {
		await sendEither(request)(response)(await value);
	} else if (typeof value === 'object' && value !== null) {
		if ('then' in value) {
			await send(request)(response)(await (value as Promise<unknown>));
		} else {
			await sendObject(request)(response)(value as Record<string, unknown>);
		}
	}
};

export const sendResponse = <
	T extends APIEndpoint<string, any, any, any, any, any, any>,
	R extends ServerAPIReturnValue<T>
>(
	request: Requests,
) => (response: express.Response) => async (
	result: R extends ServerEither<infer A> ? A : never,
): Promise<void> => {
	response.header('Content-type', 'application/json');

	// eslint-disable-next-line @typescript-eslint/await-thenable
	const awaitedResult = await result;

	for (const cookieName in awaitedResult.cookies) {
		if (awaitedResult.cookies.hasOwnProperty(cookieName)) {
			const cookie = awaitedResult.cookies[cookieName];
			response.cookie(cookieName, cookie.value, {
				domain: `${request.configuration.HOST_NAME}`,
				secure: !process.env.ALLOW_INSECURE && process.env.NODE_ENV === 'production',
				httpOnly: true,
				expires: new Date(cookie.expires),
			});
		}
	}

	if (awaitedResult === null || awaitedResult === undefined) {
		response.status(204);
		response.write(`{"direction":"right","value":null}`);
		response.end();
	} else {
		response.status(200);

		response.write('{"direction":"right","value":');
		await send(request)(response)(awaitedResult.response);
		response.write('}');
		response.end();
	}
};

export const sendError = (request: Requests) => (response: express.Response) => async (
	err: ServerError,
): Promise<void> => {
	if (err.type === 'CRASH') {
		await saveServerError(err.error, request);
	}

	response.status(err.code);
	response.json(Either.left(stripProp('type')(stripProp('error')(err))) as APIEither<any>);
};

export const endpointAdderFunc = (backendGenerator = getCombinedPAMBackend) => <
	T extends APIEndpoint<string, any, any, any, any, any, any>
>(
	app: express.Application | express.Router,
) => (
	url: APIEndpointURL<T>,
	method: APIEndpointMethod<T>,
	memberRequirement: APIEndpointMember<T>,
	tokenRequired: APIEndpointToken<T>,
	useValidator: APIEndpointUsesValidator<T>,
	validator: ValidatorImpl<APIEndpointBody<T>>,
) => (
	endpoint: (
		req: RequestType<APIEndpointParams<T>, APIEndpointBody<T>, APIEndpointMember<T>>,
	) => ReturnValue<APIEndpointReturnValue<T>>,
): void => {
	logFunc.extend('init')('Setting up handler: %s %s', method, url);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	app[method](
		url,
		bodyParser.json({
			strict: false,
		}),
		(req: Requests, res: express.Response, next: express.NextFunction) => {
			logFunc.extend('raw')('Raw request: %o', req);
			logFunc.extend('raw')('Headers from raw request: %o', req.headers);
			if (typeof req.body !== 'undefined' && req.body === 'teapot') {
				res.status(418);
				res.end();
			} else if (typeof req.body !== 'object') {
				res.status(400);
				res.json(
					Either.left({
						code: 400,
						message:
							'Request body is not recognized as properly formatted JSON. Either the JSON is invalid or a "content-type" header is missing',
					}) as APIEither<any>,
				);
			} else {
				next();
			}
		},
		(
			request: Requests<APIEndpointParams<T>, APIEndpointBody<T>>,
			response: express.Response,
		) => {
			void asyncRight<
				ServerError,
				BasicMySQLRequest<APIEndpointParams<T>, APIEndpointBody<T>>
			>(request, errorGenerator('Could not process request'))
				.flatMap<BasicAccountRequest>(accountRequestTransformer)
				.tap(accountReq => {
					debug('server:lib:api:raw')(
						'Request headers with account: %o',
						accountReq.headers,
					);
					(request as BasicAccountRequest).account = accountReq.account;
				})
				.flatMap(addMember(memberRequirement)(request))
				.flatMap(req =>
					tokenRequired
						? (tokenTransformer(backendGenerator)(
								req as PAM.BasicMemberRequest,
						  ) as AsyncEither<ServerError, Requests>)
						: Either.right(req),
				)
				.flatMap(useValidator ? validateBody(validator) : Either.right)

				.flatMap(req =>
					endpoint(
						(req as unknown) as RequestType<
							APIEndpointParams<T>,
							APIEndpointBody<T>,
							APIEndpointMember<T>
						>,
					),
				)

				.tap(sendResponse(request)(response))
				.leftTap(sendError(request)(response))
				.then(async eith => {
					await request.mysqlxSession.close();

					return eith;
				});
		},
	);
};

export const endpointAdder = endpointAdderFunc(getCombinedPAMBackend);
