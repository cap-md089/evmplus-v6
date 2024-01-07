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

import { APIEither } from '../../../api';

export * as capnhq from './capnhq';
export * as capprospective from './capprospective';
export * as capexternal from './capexternal';

/**
 * Takes a Discord ID and assigns it to an account
 *
 * Also updates a Discord account with appropriate roles, if applicable
 *
 * Meant to only be accessed through a link from a Discord bot
 */
export interface RegisterDiscord {
	(params: { discordID: string }, body: {}): APIEither<void>;

	url: '/api/member/account/registerdiscord/:discordID';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Sends an email with a password reset link to a user to give them access again
 */
export interface PasswordResetRequest {
	(params: {}, body: { username: string; captchaToken: string }): APIEither<void>;

	url: '/api/member/account/requestpasswordreset';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Using a password reset token, updates a password for a member. The member is recorded in the database and associated with the token
 */
export interface FinishPasswordReset {
	(params: {}, body: { token: string; newPassword: string }): APIEither<{}>;

	url: '/api/member/account/finishpasswordreset';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

/**
 * Using an account setup token, creates a full account
 */
export interface FinishAccountSetup {
	(params: {}, body: { password: string; token: string; username: string }): APIEither<{}>;

	url: '/api/member/account/finishsetup';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
