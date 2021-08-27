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
import { ServerEither } from 'auto-client-api';
import {
	AccountObject,
	asyncLeft,
	asyncRight,
	Crash,
	destroy,
	Either,
	errorGenerator,
	get,
	Maybe,
	MaybeObj,
	Member,
	MemberPermissions,
	MemberReference,
	memoize,
	SafeUserAccountInformation,
	ServerError,
	SigninToken,
	stringifyMemberReference,
	toReference,
	UserAccountInformation,
	UserSession,
} from 'common-lib';
import type { BasicAccountRequest } from '../../Account';
import type { Backends } from '../../backends';
import type { MemberBackend } from '../../Members';
import {
	addUserAccount,
	addUserAccountCreationToken,
	getInformationForMember,
	getInformationForUser,
	getPermissionsForMemberInAccount,
	setPermissionsForMemberInAccount,
	validateUserAccountCreationToken,
} from './Account';
import { addSignatureNonce, SigninResult, trySignin, verifyCaptcha } from './Auth';
import {
	addPasswordForUser,
	checkIfPasswordExpired,
	createPasswordResetToken,
	removePasswordValidationToken,
	validatePasswordResetToken,
} from './Password';
import {
	createSessionForUser,
	finishMFASetup,
	getTokenForUser,
	isTokenValid,
	startMFASetup,
	su,
	updateSession,
	verifyMFAToken,
} from './Session';

export {
	checkPermissions,
	getDefaultPermissions,
	RequiresMemberType,
	RequiresPermission,
	simplifyUserInformation,
} from './Account';
export {
	SigninFailed,
	SigninPasswordOld,
	SigninRequiresMFA,
	SigninResult,
	SigninSuccess,
} from './Auth';
// export * from './Password';
export {
	BasicMaybeMemberRequest,
	BasicMemberRequest,
	filterSession,
	memberRequestTransformer,
	RequireSessionType,
	getMemberSessionFromCookie,
	SessionFilterError,
} from './Session';

export interface PAMBackend {
	addUserAccountCreationToken: (member: MemberReference) => ServerEither<string>;
	addUserAccount: (
		account: AccountObject,
	) => (
		member: MemberReference,
	) => (
		credentials: [username: string, password: string],
	) => (token: string) => ServerEither<UserAccountInformation>;
	updateSession: <S extends UserSession>(session: S) => ServerEither<S>;
	setPermissions: (
		account: AccountObject,
	) => (member: MemberReference) => (permissions: MemberPermissions) => ServerEither<void>;
	verifyCaptcha: (token: string) => ServerEither<boolean>;
	getUserInformationForMember: <T extends MemberReference>(
		member: T,
	) => ServerEither<MaybeObj<UserAccountInformation<T>>>;
	getUserInformationForUser: (username: string) => ServerEither<MaybeObj<UserAccountInformation>>;
	validateUserAccountCreationToken: (token: string) => ServerEither<MemberReference>;
	createSessionForUser: <T extends MemberReference>(
		account: SafeUserAccountInformation<T>,
	) => ServerEither<UserSession<T>>;
	validatePasswordResetToken: (token: string) => ServerEither<string>;
	addPasswordForUser: (
		creds: [username: string, password: string],
	) => ServerEither<UserAccountInformation>;
	removePasswordValidationToken: (token: string) => ServerEither<void>;
	createPasswordResetToken: (username: string) => ServerEither<string>;
	getPermissionsForMemberInAccount: (
		account: AccountObject,
	) => (member: MemberReference) => ServerEither<MaybeObj<MemberPermissions>>;
	verifyMFAToken: (member: MemberReference) => (token: string) => ServerEither<void>;
	checkIfPasswordExpired: (username: string) => ServerEither<boolean>;
	finishMFASetup: (member: MemberReference) => (token: string) => ServerEither<void>;
	startMFASetup: (member: MemberReference) => ServerEither<string>;
	su: (session: UserSession) => (newUser: MemberReference) => ServerEither<void>;
	addSignatureNonce: (signatureID: string) => ServerEither<string>;
	trySignin: (
		account: AccountObject,
	) => (
		credentials: [username: string, password: string],
	) => (signinToken: SigninToken) => ServerEither<SigninResult>;
	getTokenForUser: (userInfo: SafeUserAccountInformation) => ServerEither<string>;
	isTokenValid: (member: Member) => (token: string) => ServerEither<boolean>;
}

export const getPAMBackend = (
	req: BasicAccountRequest,
	prevBackends: Backends<[MemberBackend]>,
): PAMBackend => ({
	...getRequestFreePAMBackend(req.mysqlx, prevBackends),
	verifyCaptcha: token =>
		asyncRight(
			verifyCaptcha(token, req.configuration),
			errorGenerator('Could not verify CAPTCHA token'),
		),
	trySignin: account => ([username, password]) => (token: SigninToken) =>
		asyncRight(
			trySignin(
				req.mysqlx,
				prevBackends,
				account,
				username,
				password,
				token,
				req.configuration,
			),
			errorGenerator('Could not sign in'),
		),
});

export const getRequestFreePAMBackend = (
	mysqlx: Schema,
	prevBackend: Backends<[MemberBackend]>,
): PAMBackend => ({
	addUserAccountCreationToken: member => addUserAccountCreationToken(mysqlx, toReference(member)),
	addUserAccount: account => member => ([username, password]) => token =>
		addUserAccount(
			mysqlx,
			prevBackend,
			account,
			username,
			password,
			toReference(member),
			token,
		),
	updateSession: session => updateSession(mysqlx, session),
	setPermissions: account => member => permissions =>
		asyncRight(
			setPermissionsForMemberInAccount(mysqlx, member, permissions, account),
			errorGenerator('Could not set member permissions'),
		),
	verifyCaptcha: () =>
		asyncLeft({
			type: 'OTHER',
			code: 400,
			message: `Function 'verifyCaptcha' not implemented`,
		}),
	getUserInformationForMember: memoize(
		member =>
			asyncRight(
				getInformationForMember(mysqlx, member),
				errorGenerator('Could not get user information'),
			)
				.map(Maybe.some)
				.leftFlatMap(err =>
					(err as Crash).error.message === 'Could not find user specified'
						? Either.right(Maybe.none())
						: Either.left(err),
				),
		stringifyMemberReference,
	) as <T extends MemberReference>(ref: T) => ServerEither<MaybeObj<UserAccountInformation<T>>>,
	getUserInformationForUser: memoize(username =>
		asyncRight(
			getInformationForUser(mysqlx, username),
			errorGenerator('Could not get user information'),
		)
			.map(Maybe.some)
			.leftFlatMap(err =>
				(err as Crash).error.message === 'Could not find user specified'
					? Either.right(Maybe.none())
					: Either.left(err),
			),
	),
	validateUserAccountCreationToken: token =>
		asyncRight(validateUserAccountCreationToken(mysqlx, token), error =>
			error.message === 'Could not match user account creation token'
				? {
						type: 'OTHER',
						code: 400,
						message: 'Could not match user account creation token',
				  }
				: { type: 'CRASH', error, code: 500, message: error.message },
		),
	createSessionForUser: <T extends MemberReference>(account: SafeUserAccountInformation<T>) =>
		createSessionForUser(mysqlx, account) as ServerEither<UserSession<T>>,
	validatePasswordResetToken: token => validatePasswordResetToken(mysqlx, token),
	addPasswordForUser: ([username, password]) => addPasswordForUser(mysqlx, username, password),
	removePasswordValidationToken: token => removePasswordValidationToken(mysqlx, token),
	createPasswordResetToken: username => createPasswordResetToken(mysqlx, username),
	getPermissionsForMemberInAccount: memoize(
		account =>
			memoize(
				member =>
					asyncRight(
						getPermissionsForMemberInAccount(mysqlx, toReference(member), account),
						errorGenerator('Could not get member permissions'),
					)
						.map(Maybe.some)
						.leftFlatMap(err =>
							err.type === 'CRASH' &&
							err.error.message === 'Could not get permissions for user'
								? Either.right(Maybe.none())
								: Either.left(err),
						),
				stringifyMemberReference,
			),
		get('id'),
	),
	verifyMFAToken: member => verifyMFAToken(mysqlx)(toReference(member)),
	checkIfPasswordExpired: checkIfPasswordExpired(mysqlx),
	finishMFASetup: member => finishMFASetup(mysqlx)(toReference(member)),
	startMFASetup: member => startMFASetup(mysqlx)(toReference(member)),
	su: session => member =>
		asyncRight(
			su(mysqlx, session, toReference(member)),
			err =>
				(err.message === 'Cannot use su if not Rioux'
					? { type: 'OTHER', code: 403, message: err.message }
					: {
							type: 'CRASH',
							code: 500,
							message: err.message,
							error: err,
					  }) as ServerError,
		).map(destroy),
	addSignatureNonce: signatureID => addSignatureNonce(mysqlx)(signatureID),
	trySignin: () => () => () =>
		asyncLeft({
			type: 'OTHER',
			code: 400,
			message: `Function 'trySignin' not implemented`,
		}),
	getTokenForUser: account =>
		asyncRight(getTokenForUser(mysqlx, account), errorGenerator('Could not get token')),
	isTokenValid: member => token =>
		asyncRight(isTokenValid(mysqlx, member, token), errorGenerator('Could not validate token')),
});
