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

import { Schema } from '@mysql/xdevapi';
import {
	Either,
	MemberCreateError,
	MemberReference,
	PasswordResult,
	ServerConfiguration,
	SessionType,
	UserAccountInformation,
	UserSession,
} from 'common-lib';
import * as rp from 'request-promise';
import { collectResults, findAndBind } from '../../MySQLUtil';
import { getInformationForUser, simplifyUserInformation } from './Account';
import { checkIfPasswordValid } from './Password';
import { createSessionForUser, updateSession, memberUsesMFA } from './Session';

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

export interface SigninRequiresMFA {
	result: MemberCreateError.ACCOUNT_USES_MFA;
	sessionID: string;
}

export type SigninResult = SigninSuccess | SigninPasswordOld | SigninFailed | SigninRequiresMFA;

export const verifyCaptcha = async (
	response: string,
	conf: ServerConfiguration,
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
	conf: ServerConfiguration,
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

	let usesMFA: boolean;
	try {
		usesMFA = await memberUsesMFA(schema)(member).fullJoin();
	} catch (e) {
		return {
			result: MemberCreateError.UNKOWN_SERVER_ERROR,
		};
	}

	console.log(usesMFA);

	const session = await createSessionForUser(
		schema,
		simplifyUserInformation(userInformation),
	).join();

	return Either.cata(() =>
		Promise.resolve<SigninResult>({
			result: MemberCreateError.SERVER_ERROR,
		}),
	)(async (sess: UserSession) => {
		if (usesMFA) {
			return updateSession(schema, {
				...sess,
				type: SessionType.IN_PROGRESS_MFA,
			})
				.join()
				.then(
					Either.cata<any, any, SigninResult>(() => ({
						result: MemberCreateError.SERVER_ERROR,
					}))(() => ({
						result: MemberCreateError.ACCOUNT_USES_MFA,
						sessionID: sess.id,
					})),
				);
		}

		if (valid === PasswordResult.VALID_EXPIRED) {
			return updateSession(schema, {
				...sess,
				type: SessionType.PASSWORD_RESET,
			})
				.join()
				.then(
					Either.cata(() => ({ result: MemberCreateError.SERVER_ERROR } as SigninResult))(
						() =>
							({
								result: MemberCreateError.PASSWORD_EXPIRED,
								sessionID: sess.id,
							} as SigninResult),
					),
				);
		}

		return {
			result: MemberCreateError.NONE,
			member,
			sessionID: sess.id,
		};
	})(session);
};
