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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	AccountLinkTarget,
	always,
	api,
	AsyncEither,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	collectGeneratorAsync,
	Either,
	EitherObj,
	errorGenerator,
	get,
	getDefaultAdminPermissions,
	isRioux,
	Maybe,
	MemberCreateError,
	Right,
	ServerError,
	SigninReturn,
	toReference,
	User,
} from 'common-lib';
import {
	getAdminAccountIDsForMember,
	getUnfinishedTaskCountForMember,
	getUnreadNotificationCount,
	ServerEither,
} from 'server-common';

export const func: ServerAPIEndpoint<api.Check> = req =>
	Maybe.cata<User, ServerEither<SigninReturn>>(
		always(
			asyncRight<ServerError, SigninReturn>(
				{
					error: MemberCreateError.INVALID_SESSION_ID,
				},
				errorGenerator('What?'),
			),
		),
	)(user =>
		AsyncEither.All([
			getUnreadNotificationCount(req.mysqlx)(req.account)(user),
			getUnfinishedTaskCountForMember(req.mysqlx)(req.account)(user),
			asyncRight<ServerError, AccountLinkTarget[]>(
				collectGeneratorAsync(
					asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(get('value'))(
						asyncIterFilter<
							EitherObj<ServerError, AccountLinkTarget>,
							Right<AccountLinkTarget>
						>(Either.isRight)(
							getAdminAccountIDsForMember(req.mysqlx)(toReference(user)),
						),
					),
				),
				errorGenerator('Could not get admin account IDs for member'),
			),
		]).map(([notificationCount, taskCount, linkableAccounts]) => ({
			error: MemberCreateError.NONE,
			sessionID: user.sessionID,
			member: isRioux(user)
				? { ...user, permissions: getDefaultAdminPermissions(req.account.type) }
				: user,
			notificationCount,
			taskCount,
			linkableAccounts: linkableAccounts.filter(({ id }) => id !== req.account.id),
		})),
	)(req.member);

export default func;
