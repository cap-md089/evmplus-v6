/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents how accounts are managed for CAP NHQ members
 *
 * See `common-lib/src/typings/api.ts` for more information
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

import { APIEither } from '../../../api';
import { EmailSentType } from '../../../types';

/**
 * Requests a username of an account based off of a CAP ID
 */
export interface UsernameRequest {
	(
		params: {},
		body: {
			capid: number;
			captchaToken: string;
		},
	): APIEither<void>;

	url: '/api/member/account/capnhq/requestusername';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Creates a token to create an account based off a CAP ID
 */
export interface RequestNHQAccount {
	(params: {}, body: { capid: number; email: string; recaptcha: string }): APIEither<
		EmailSentType
	>;

	url: '/api/member/account/capnhq/requestaccount';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
