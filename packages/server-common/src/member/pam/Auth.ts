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
	AccountObject,
	areMembersTheSame,
	asyncIterReduce,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	Member,
	MemberCreateError,
	MemberReference,
	PasswordResult,
	ServerConfiguration,
	ServerError,
	SessionType,
	SignatureSigninToken,
	SigninKeyScopeType,
	SigninToken,
	SigninTokenType,
	StoredSigninKey,
	StoredSigninNonce,
	UserAccountInformation,
	UserSession,
} from 'common-lib';
import * as rp from 'request-promise';
import { collectResults, findAndBind } from '../../MySQLUtil';
import { getInformationForUser, simplifyUserInformation } from './Account';
import { checkIfPasswordValid } from './Password';
import { createSessionForUser, updateSession, memberUsesMFA } from './Session';
import { createVerify, createPublicKey, randomBytes } from 'crypto';
import { ServerEither } from '../../servertypes';
import { promisify } from 'util';
import { getMembers } from '../../Account';

const randomBytesPromise = promisify(randomBytes);

// Expire in 30 seconds
const NONCE_EXPIRE_TIME = 30 * 1000;

export interface SigninSuccess {
	result: MemberCreateError.NONE;
	sessionID: string;
	expires: number;
	member: MemberReference;
}

export interface SigninPasswordOld {
	result: MemberCreateError.PASSWORD_EXPIRED;
	sessionID: string;
	expires: number;
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
	expires: number;
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

export const addSignatureNonceFunc = (now: () => number) => (schema: Schema) => (
	signatureID: string,
): ServerEither<string> =>
	asyncRight(
		schema.getCollection<StoredSigninNonce>('SignatureNonces'),
		errorGenerator('Could not create nonce'),
	).flatMap<string>(collection =>
		asyncRight(randomBytesPromise(32), errorGenerator('Could not create nonce'))
			.map<string>(buf => buf.toString('hex'))
			.tap(async buf => {
				await collection
					.add({
						expireTime: Date.now() + NONCE_EXPIRE_TIME,
						nonce: buf,
						signatureID,
					})
					.execute();
			}),
	);
export const addSignatureNonce = addSignatureNonceFunc(Date.now);

export const verifySignatureToken = async (
	schema: Schema,
	account: AccountObject,
	userInformation: UserAccountInformation,
	token: SignatureSigninToken,
	conf: ServerConfiguration,
): Promise<boolean> => {
	const [fastNonces, keys] = await Promise.all([
		collectResults(
			findAndBind(schema.getCollection<StoredSigninNonce>('SignatureNonces'), {
				nonce: token.nonce,
				signatureID: token.signatureID,
			}),
		),
		collectResults(
			findAndBind(schema.getCollection<StoredSigninKey>('SigninKeys'), {
				signatureID: token.signatureID,
			}),
		),
		schema
			.getCollection<StoredSigninNonce>('SignatureNonces')
			.remove('expireTime < :expireTime')
			.bind('expireTime', Date.now())
			.execute(),
	]);

	const nonces = fastNonces.filter(n => n.expireTime > Date.now());

	const removeNonces = schema
		.getCollection<StoredSigninNonce>('SignatureNonces')
		.remove('signatureID = :signatureID and nonce = :nonce')
		.bind({
			nonce: token.nonce,
			signatureID: token.signatureID,
		})
		.execute();

	if (keys.length !== 1) {
		await removeNonces;
		console.error('Unknown key signature:', token.signatureID);
		return false;
	}

	if (nonces.length !== 1) {
		await removeNonces;
		console.error('Could not find cryptographic nonce for key:', token.signatureID);
		return false;
	}

	const key = keys[0];
	const pubKey = createPublicKey(key.publicKey);

	const verifier = createVerify('SHA256');
	verifier.update(`${token.nonce}`);
	verifier.end();

	if (!verifier.verify(pubKey, Buffer.from(token.signature, 'hex'))) {
		await removeNonces;
		return false;
	}

	const scope = key.scope;
	switch (scope.type) {
		case SigninKeyScopeType.GLOBAL: {
			await removeNonces;
			return true;
		}

		case SigninKeyScopeType.ACCOUNT: {
			return (
				await Promise.all([
					asyncIterReduce<EitherObj<ServerError, Member>, boolean>(
						(prev, member) =>
							prev ||
							(Either.isRight(member) &&
								areMembersTheSame(member.value)(userInformation.member)),
					)(false)(getMembers(schema)(account)()),
					removeNonces,
				])
			)[0];
		}

		case SigninKeyScopeType.USER: {
			await removeNonces;
			return areMembersTheSame(scope.member)(userInformation.member);
		}
	}
};

export const verifySigninToken = async (
	schema: Schema,
	account: AccountObject,
	userInformation: UserAccountInformation,
	token: SigninToken,
	conf: ServerConfiguration,
): Promise<boolean> => {
	switch (token.type) {
		case SigninTokenType.RECAPTCHA:
			return verifyCaptcha(token.recaptchToken, conf);

		case SigninTokenType.SIGNATURE:
			try {
				return await verifySignatureToken(schema, account, userInformation, token, conf);
			} catch (e) {
				return false;
			}
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
	account: AccountObject,
	username: string,
	password: string,
	signinToken: SigninToken,
	conf: ServerConfiguration,
): Promise<SigninResult> => {
	let userInformation;
	try {
		userInformation = await getInformationForUser(schema, username);
	} catch (e) {
		return {
			result: MemberCreateError.INCORRRECT_CREDENTIALS,
		};
	}

	if (!(await verifySigninToken(schema, account, userInformation, signinToken, conf))) {
		return {
			result: MemberCreateError.RECAPTCHA_INVALID,
		};
	}

	const valid = await checkIfPasswordValid(schema, username, password, userInformation);
	if (valid === PasswordResult.INVALID) {
		return {
			result: MemberCreateError.INCORRRECT_CREDENTIALS,
		};
	}

	const member = await getUserID(schema, username);

	let usesMFA: boolean;
	try {
		usesMFA = await memberUsesMFA(schema)(member).fullJoin();
	} catch (e) {
		return {
			result: MemberCreateError.UNKOWN_SERVER_ERROR,
		};
	}

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
						expires: sess.expires,
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
								expires: sess.expires,
							} as SigninResult),
					),
				);
		}

		return {
			result: MemberCreateError.NONE,
			member,
			sessionID: sess.id,
			expires: sess.expires,
		};
	})(session);
};
