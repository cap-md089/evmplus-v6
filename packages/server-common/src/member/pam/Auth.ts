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
	asyncRight,
	Either,
	errorGenerator,
	MemberCreateError,
	MemberReference,
	PasswordResult,
	ServerConfiguration,
	SessionType,
	SignatureSigninToken,
	SigninKeyScopeType,
	SigninToken,
	SigninTokenType,
	StoredSigninKey,
	StoredSigninNonce,
	UserAccountInformation,
} from 'common-lib';
import { createPublicKey, createVerify, randomBytes } from 'crypto';
import * as rp from 'request-promise';
import { promisify } from 'util';
import { TimeBackend } from '../..';
import { Backends } from '../../backends';
import { MemberBackend } from '../../Members';
import { collectResults, findAndBind } from '../../MySQLUtil';
import { ServerEither } from '../../servertypes';
import { getInformationForUser, simplifyUserInformation } from './Account';
import { checkIfPasswordValid } from './Password';
import { createSessionForUser, memberUsesMFA, updateSession } from './Session';

const randomBytesPromise = promisify(randomBytes);

// Expire in 30 seconds
const NONCE_EXPIRE_TIME = 30 * 1000;

export interface SigninSuccess {
	result: MemberCreateError.NONE;
	sessionID: string;
	expires: number;
	member: MemberReference;
}

export interface SigninExpired {
	result: MemberCreateError.ACCOUNT_EXPIRED;
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
		| MemberCreateError.RECAPTCHA_INVALID
		| MemberCreateError.ACCOUNT_EXPIRED;
}

export interface SigninRequiresMFA {
	result: MemberCreateError.ACCOUNT_USES_MFA;
	sessionID: string;
	expires: number;
}

export type SigninResult =
	| SigninSuccess
	| SigninPasswordOld
	| SigninFailed
	| SigninRequiresMFA
	| SigninExpired;

export const verifyCaptcha = async (
	response: string,
	conf: ServerConfiguration,
): Promise<boolean> => {
	if (process.env.NODE_ENV === 'test') {
		return true;
	}

	try {
		const results = (await rp('https://www.google.com/recaptcha/api/siteverify', {
			followRedirect: false,
			method: 'POST',
			form: {
				secret: conf.RECAPTCHA_SECRET,
				response,
			},
			resolveWithFullResponse: false,
			simple: true,
		})) as string;

		return (JSON.parse(results) as { success: boolean }).success;
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
						expireTime: now() + NONCE_EXPIRE_TIME,
						nonce: buf,
						signatureID,
					})
					.execute();
			}),
	);
export const addSignatureNonce = addSignatureNonceFunc(Date.now);

export const verifySignatureToken = async (
	schema: Schema,
	backends: Backends<[MemberBackend]>,
	account: AccountObject,
	userInformation: UserAccountInformation,
	token: SignatureSigninToken,
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
					backends
						.getMember(account)(userInformation.member)
						.flatMap(backends.accountHasMember(account))
						.fullJoin(),
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
	backends: Backends<[MemberBackend]>,
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
				return await verifySignatureToken(
					schema,
					backends,
					account,
					userInformation,
					token,
				);
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
	backend: Backends<[MemberBackend, TimeBackend]>,
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

	if (!(await verifySigninToken(schema, backend, account, userInformation, signinToken, conf))) {
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

	let member: MemberReference;
	try {
		member = await getUserID(schema, username);
	} catch (e) {
		return {
			result: MemberCreateError.INCORRRECT_CREDENTIALS,
		};
	}

	try {
		const fullMember = await backend.getMember(account)(member).fullJoin();

		if (fullMember.type === 'CAPNHQMember' && fullMember.expirationDate < backend.now()) {
			return {
				result: MemberCreateError.ACCOUNT_EXPIRED,
			};
		}
	} catch (e) {
		return {
			result: MemberCreateError.UNKOWN_SERVER_ERROR,
		};
	}

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
	).fullJoin();

	if (usesMFA) {
		return updateSession(schema, {
			...session,
			type: SessionType.IN_PROGRESS_MFA,
		})
			.join()
			.then(
				Either.cata<any, any, SigninResult>(() => ({
					result: MemberCreateError.SERVER_ERROR,
				}))(() => ({
					result: MemberCreateError.ACCOUNT_USES_MFA,
					sessionID: session.id,
					expires: session.expires,
				})),
			);
	}

	if (valid === PasswordResult.VALID_EXPIRED) {
		return updateSession(schema, {
			...session,
			type: SessionType.PASSWORD_RESET,
		})
			.join()
			.then(
				Either.cata(() => ({ result: MemberCreateError.SERVER_ERROR } as SigninResult))(
					() =>
						({
							result: MemberCreateError.PASSWORD_EXPIRED,
							sessionID: session.id,
							expires: session.expires,
						} as SigninResult),
				),
			);
	}

	return {
		result: MemberCreateError.NONE,
		member,
		sessionID: session.id,
		expires: session.expires,
	};
};
