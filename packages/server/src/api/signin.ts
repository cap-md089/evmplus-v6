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

import { AsyncRepr, ServerAPIRequestParameter } from 'auto-client-api';
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
	SigninToken,
	SuccessfulSigninReturn,
	toReference,
} from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	GenBackend,
	getCombinedMemberBackend,
	MemberBackend,
	PAM,
	ServerEither,
	withBackends,
} from 'server-common';
import { Endpoint } from '..';
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

const handleSuccess = (backend: Backends<[MemberBackend, PAM.PAMBackend]>) => (
	req: ServerAPIRequestParameter<api.Signin>,
) => (result: PAM.SigninSuccess): ServerEither<Wrapped<SuccessfulSigninReturn>> =>
	AsyncEither.All([
		backend
			.getMember(req.account)(result.member)
			.flatMap(member =>
				asyncRight<ServerError, AccountLinkTarget[]>(
					collectGeneratorAsync(
						asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(get('value'))(
							asyncIterFilter<
								EitherObj<ServerError, AccountLinkTarget>,
								Right<AccountLinkTarget>
							>(Either.isRight)(
								backend.getAdminAccountIDs(backend)(toReference(member)),
							),
						),
					),
					errorGenerator('Could not get admin account IDs for member'),
				).map(accounts => [member, accounts] as const),
			),
		backend
			.getPermissionsForMemberInAccount(req.account)(result.member)
			.map(PAM.getDefaultPermissions(req.account)),
		backend.getUnreadNotificationCountForMember(req.account)(result.member),
		backend.getUnfinishedTaskCountForMember(req.account)(result.member),
		backend.logSignin(req.account)(result.member),
	]).map(([[member, linkableAccounts], permissions, notificationCount, taskCount]) => ({
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

const handleMFA = (backend: Backends<[MemberBackend, PAM.PAMBackend]>) => (
	req: ServerAPIRequestParameter<api.Signin>,
) => (token: SigninToken) => (result: PAM.SigninRequiresMFA): ServerEither<Wrapped<SigninReturn>> =>
	token.type === 'Recaptcha'
		? asyncRight<ServerError, Wrapped<SigninRequiresMFA>>(
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
		  )
		: AsyncEither.All([
				backend
					.getMember(req.account)(result.member)
					.flatMap(member =>
						asyncRight<ServerError, AccountLinkTarget[]>(
							collectGeneratorAsync(
								asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(
									get('value'),
								)(
									asyncIterFilter<
										EitherObj<ServerError, AccountLinkTarget>,
										Right<AccountLinkTarget>
									>(Either.isRight)(
										backend.getAdminAccountIDs(backend)(toReference(member)),
									),
								),
							),
							errorGenerator('Could not get admin account IDs for member'),
						).map(accounts => [member, accounts] as const),
					),
				backend
					.getPermissionsForMemberInAccount(req.account)(result.member)
					.map(PAM.getDefaultPermissions(req.account)),
				backend.getUnreadNotificationCountForMember(req.account)(result.member),
				backend.getUnfinishedTaskCountForMember(req.account)(result.member),
				backend.logSignin(req.account)(result.member),
		  ]).map(([[member, linkableAccounts], permissions, notificationCount, taskCount]) => ({
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

export const func: Endpoint<
	Backends<[MemberBackend, PAM.PAMBackend]>,
	api.Signin
> = backend => req =>
	backend
		.trySignin(req.account)([req.body.username, req.body.password])(req.body.token)
		.flatMap<Wrapped<SigninReturn>>(results =>
			results.result === MemberCreateError.NONE
				? handleSuccess(backend)(req)(results)
				: results.result === MemberCreateError.PASSWORD_EXPIRED
				? handlePasswordExpired(results)
				: results.result === MemberCreateError.ACCOUNT_USES_MFA
				? handleMFA(backend)(req)(req.body.token)(results)
				: handleFailure(results),
		);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[GenBackend<ReturnType<typeof getCombinedMemberBackend>>, PAM.PAMBackend]
	>(getCombinedMemberBackend(), PAM.getPAMBackend),
);
