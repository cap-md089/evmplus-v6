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

import { Schema } from '@mysql/xdevapi';
import {
	Either,
	MemberCreateError,
	MemberReference,
	PasswordResult,
	UserAccountInformation,
	SessionType,
	UserSession,
	ServerConfiguration,
} from 'common-lib';
import * as rp from 'request-promise';
import { checkIfPasswordValid } from './Password';
import { getInformationForUser } from './Account';
import { createSessionForUser, setSessionType } from './Session';
import { findAndBind, collectResults } from '../../MySQLUtil';

export interface SigninSuccess {
	result: MemberCreateError.NONE;
	sessionID: string;
	member: MemberReference;
}

export interface SigninPasswordOld {
	result: MemberCreateError.PASSWORD_EXPIRED;
	sessionID: string;
}

export interface SigninFailed {
	result:
		| MemberCreateError.INCORRRECT_CREDENTIALS
		| MemberCreateError.SERVER_ERROR
		| MemberCreateError.UNKOWN_SERVER_ERROR
		| MemberCreateError.RECAPTCHA_INVALID;
}

export type SigninResult = SigninSuccess | SigninPasswordOld | SigninFailed;

export const verifyCaptcha = async (
	response: string,
	conf: ServerConfiguration
): Promise<boolean> => {
	if (process.env.NODE_ENV === 'test') {
		return true;
	}

	try {
		const results = await rp('https://www.google.com/recaptcha/api/siteverify', {
			followRedirect: false,
			method: 'POST',
			form: {
				secret: conf.RECAPTCHA_SECRET,
				response,
			},
			resolveWithFullResponse: false,
			simple: true,
		});

		return JSON.parse(results).success;
	} catch (e) {
		return false;
	}
};

const getUserID = async (schema: Schema, username: string): Promise<MemberReference> => {
	const userMappingCollection = schema.getCollection<UserAccountInformation>('UserAccountInfo');

	const userFinder = findAndBind(userMappingCollection, {
		username,
	});

	const userList = await collectResults(userFinder);

	if (userList.length !== 1) {
		throw new Error('Could not find username specified');
	}

	return userList[0].member;
};

/**
 * Tries to sign in given the username and password
 * reCAPTCHA is kept as a placeholder so that it will be easier to add in the future
 *
 * @param schema the database that the account information resides in
 * @param username the username to check
 * @param password the password to verify the username with
 * @param recaptchaCode the code passed to the server from the client
 */
export const trySignin = async (
	schema: Schema,
	username: string,
	password: string,
	recaptchaCode: string,
	conf: ServerConfiguration
): Promise<SigninResult> => {
	if (!(await verifyCaptcha(recaptchaCode, conf))) {
		return {
			result: MemberCreateError.RECAPTCHA_INVALID,
		};
	}

	const valid = await checkIfPasswordValid(schema, username, password);
	if (valid === PasswordResult.INVALID) {
		return {
			result: MemberCreateError.INCORRRECT_CREDENTIALS,
		};
	}

	const [member, userInformation] = await Promise.all([
		getUserID(schema, username),
		getInformationForUser(schema, username),
	]);

	const session = await createSessionForUser(schema, userInformation).join();

	return Either.cata(() =>
		Promise.resolve<SigninResult>({
			result: MemberCreateError.SERVER_ERROR,
		})
	)(async (sess: UserSession) => {
		if (valid === PasswordResult.VALID_EXPIRED) {
			return setSessionType(schema, sess, SessionType.PASSWORD_RESET)
				.join()
				.then(
					Either.cata(() => ({ result: MemberCreateError.SERVER_ERROR } as SigninResult))(
						() =>
							({
								result: MemberCreateError.PASSWORD_EXPIRED,
								sessionID: sess.id,
							} as SigninResult)
					)
				);
		}

		return {
			result: MemberCreateError.NONE,
			member,
			sessionID: sess.id,
		};
	})(session);
};
