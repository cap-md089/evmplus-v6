/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * This file holds all the other APIs while also documenting some
 * global level APIs
 *
 * See `common-lib/src/typings/api.ts` for more information
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

import { APIEither } from '../api';
import { AccountObject, FileObject, SigninRequest, SigninReturn } from '../types';

export * as changelog from './changelog';
export * as errors from './errors';
export * as events from './events';
export * as files from './files';
export * as member from './member';
export * as notifications from './notifications';
export * as registry from './registry';
export * as tasks from './tasks';
export * as team from './team';

/**
 * Gets the account associated with the URL
 */
export interface AccountCheck {
	(params: {}, body: {}): APIEither<AccountObject>;

	url: '/api/accountcheck';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Checks the validity of the member in the request,
 * while also checking unread notifications, task counts,
 * and accounts the member is able to link events to
 */
export interface Check {
	(params: {}, body: {}): APIEither<SigninReturn>;

	url: '/api/check';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: false;
}

/**
 * A simple JSON echo server
 */
export interface Echo {
	(params: {}, body: any): any;

	url: '/api/echo';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets a token used for the requests that need a token
 */
export interface FormToken {
	(params: {}, body: {}): APIEither<string>;

	url: '/api/token';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: false;
}

/**
 * Using a username, password, and the appropriate
 * reCAPTCHA token, signs in a user and returns
 * user information to include a session ID
 */
export interface Signin {
	(params: {}, body: SigninRequest): APIEither<SigninReturn>;

	url: '/api/signin';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets a cryptographic nonce for some of the SigninTokens used
 * for the signin function above
 */
export interface GetSigninToken {
	(params: { signatureID: string }, body: {}): APIEither<string>;

	url: '/api/signintoken/:signatureID';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: false;
}

/**
 * Returns a list of all the files that are valid slideshow files
 * (they have the property forSlideshow: true)
 */
export interface SlideshowImageIDs {
	(params: {}, body: {}): APIEither<FileObject[]>;

	url: '/api/banner';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
