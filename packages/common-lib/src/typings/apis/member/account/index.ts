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

import { APIEither } from '../../../api';

export * as capnhq from './capnhq';
export * as capprospective from './capprospective';

export interface RegisterDiscord {
	(params: { discordID: string }, body: {}): APIEither<void>;

	url: '/api/member/account/registerdiscord/:discordID';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface PasswordResetRequest {
	(params: {}, body: { username: string; captchaToken: string }): APIEither<void>;

	url: '/api/member/account/requestpasswordreset';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface FinishPasswordReset {
	(params: {}, body: { token: string; newPassword: string }): APIEither<{ sessionID: string }>;

	url: '/api/member/account/finishpasswordreset';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface FinishAccountSetup {
	(params: {}, body: { password: string; token: string; username: string }): APIEither<{
		sessionID: string;
	}>;

	url: '/api/member/account/finishsetup';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
