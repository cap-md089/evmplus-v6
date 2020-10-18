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

import { AsyncRepr, ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	AccountLinkTarget,
	api,
	AsyncEither,
	asyncIterFilter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	ExpiredSuccessfulSigninReturn,
	FailedSigninReturn,
	get,
	MemberCreateError,
	Right,
	ServerError,
	SigninRequiresMFA,
	SigninReturn,
	SuccessfulSigninReturn,
	toReference,
} from 'common-lib';
import {
	getAdminAccountIDsForMember,
	getUnfinishedTaskCountForMember,
	getUnreadNotificationCount,
	logSignin,
	PAM,
	resolveReference,
	ServerEither,
} from 'server-common';
import { getPermissionsForMemberInAccountDefault } from 'server-common/dist/member/pam';
import wrapper from '../lib/wrapper';

interface Wrapped<T> {
	response: AsyncRepr<T>;
	cookies: Record<
		string,
		{
			value: string;
			expires: number;
		}
	>;
}

const handleSuccess = (req: ServerAPIRequestParameter<api.Signin>) => (
	result: PAM.SigninSuccess,
): ServerEither<Wrapped<SuccessfulSigninReturn>> =>
	AsyncEither.All([
		resolveReference(req.mysqlx)(req.account)(result.member),
		asyncRight(
			getPermissionsForMemberInAccountDefault(req.mysqlx, result.member, req.account),
			errorGenerator('Could not get permissions for member'),
		),
		getUnreadNotificationCount(req.mysqlx)(req.account)(result.member),
		getUnfinishedTaskCountForMember(req.mysqlx)(req.account)(result.member),
		asyncRight<ServerError, AccountLinkTarget[]>(
			collectGeneratorAsync(
				asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(get('value'))(
					asyncIterFilter<
						EitherObj<ServerError, AccountLinkTarget>,
						Right<AccountLinkTarget>
					>(Either.isRight)(
						getAdminAccountIDsForMember(req.mysqlx)(toReference(result.member)),
					),
				),
			),
			errorGenerator('Could not get admin account IDs for member'),
		),
		logSignin(req.mysqlx)(req.account)(result.member),
	]).map(([member, permissions, notificationCount, taskCount, linkableAccounts]) => ({
		response: {
			error: MemberCreateError.NONE,
			member: {
				...member,
				permissions,
			},
			notificationCount,
			taskCount,
			linkableAccounts: linkableAccounts.filter(({ id }) => id !== req.account.id),
		},
		cookies: {
			sessionID: {
				expires: result.expires,
				value: result.sessionID,
			},
		},
	}));

const handlePasswordExpired = (
	result: PAM.SigninPasswordOld,
): ServerEither<Wrapped<ExpiredSuccessfulSigninReturn>> =>
	asyncRight<ServerError, Wrapped<ExpiredSuccessfulSigninReturn>>(
		{
			response: {
				error: MemberCreateError.PASSWORD_EXPIRED,
			},
			cookies: {
				sessionID: {
					expires: result.expires,
					value: result.sessionID,
				},
			},
		},
		errorGenerator('Could not handle failure'),
	);

const handleFailure = (result: PAM.SigninFailed): ServerEither<Wrapped<FailedSigninReturn>> =>
	(result.result === MemberCreateError.SERVER_ERROR ||
	result.result === MemberCreateError.UNKOWN_SERVER_ERROR
		? asyncLeft<ServerError, FailedSigninReturn>({
				type: 'OTHER',
				code: 500,
				message: 'Unknown error occurred',
		  })
		: asyncRight<ServerError, FailedSigninReturn>(
				{
					error: result.result,
				},
				errorGenerator('Could not handle failure'),
		  )
	).map(wrapper);

const handleMFA = (req: ServerAPIRequestParameter<api.Signin>) => (
	result: PAM.SigninRequiresMFA,
): ServerEither<Wrapped<SigninRequiresMFA>> =>
	asyncRight<ServerError, Wrapped<SigninRequiresMFA>>(
		{
			response: {
				error: MemberCreateError.ACCOUNT_USES_MFA,
			},
			cookies: {
				sessionID: {
					expires: result.expires,
					value: result.sessionID,
				},
			},
		},
		errorGenerator('Could not handle failure'),
	);

export const func: ServerAPIEndpoint<api.Signin> = req =>
	asyncRight(
		PAM.trySignin(
			req.mysqlx,
			req.account,
			req.body.username,
			req.body.password,
			req.body.token,
			req.configuration,
		),
		errorGenerator('Could not sign in'),
	).flatMap<Wrapped<SigninReturn>>(results =>
		results.result === MemberCreateError.NONE
			? handleSuccess(req)(results)
			: results.result === MemberCreateError.PASSWORD_EXPIRED
			? handlePasswordExpired(results)
			: results.result === MemberCreateError.ACCOUNT_USES_MFA
			? handleMFA(req)(results)
			: handleFailure(results),
	);

export default func;
