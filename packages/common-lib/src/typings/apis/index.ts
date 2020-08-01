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

import { APIEither } from '../api';
import { AccountObject, FileObject, SigninReturn } from '../types';

export * as errors from './errors';
export * as events from './events';
export * as files from './files';
export * as member from './member';
export * as notifications from './notifications';
export * as registry from './registry';
export * as tasks from './tasks';
export * as team from './team';

export interface AccountCheck {
	(params: {}, body: {}): APIEither<AccountObject>;

	url: '/api/accountcheck';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface Check {
	(params: {}, body: {}): APIEither<SigninReturn>;

	url: '/api/check';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface Echo {
	(params: {}, body: any): any;

	url: '/api/echo';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface FormToken {
	(params: {}, body: {}): APIEither<string>;

	url: '/api/token';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface Signin {
	(
		params: {},
		body: {
			username: string;
			password: string;
			recaptcha: string;
		}
	): APIEither<SigninReturn>;

	url: '/api/signin';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface SlideshowImageIDs {
	(params: {}, body: {}): APIEither<FileObject[]>;

	url: '/api/banner';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
