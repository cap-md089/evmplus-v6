/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountLinkTarget,
	ActiveSession,
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
import * as debug from 'debug';
import {
	Backends,
	combineBackends,
	BasicAccountRequest,
	GenBackend,
	MemberBackend,
	ServerEither,
	withBackends,
	CAP,
	PAM,
	getCombinedMemberBackend,
} from 'server-common';
import { Endpoint } from '..';
import wrapper, { Wrapped } from '../lib/wrapper';

const logFunc = debug('server:api:check');

export const func: Endpoint<
	Backends<[PAM.PAMBackend, CAP.CAPMemberBackend, MemberBackend]>,
	api.Check
> = backend => req => {
	logFunc('Starting check request: %o', req.member);
	return Maybe.cata<[User, ActiveSession], ServerEither<Wrapped<SigninReturn>>>(
		always(
			asyncRight<ServerError, SigninReturn>(
				{
					error: MemberCreateError.INVALID_SESSION_ID,
				},
				errorGenerator('What?'),
			).map(wrapper),
		),
	)(([user, session]) =>
		AsyncEither.All([
			backend.getUnreadNotificationCountForMember(req.account)(user),
			backend.getUnfinishedTaskCountForMember(req.account)(user),
			asyncRight<ServerError, AccountLinkTarget[]>(
				collectGeneratorAsync(
					asyncIterMap<Right<AccountLinkTarget>, AccountLinkTarget>(get('value'))(
						asyncIterFilter<
							EitherObj<ServerError, AccountLinkTarget>,
							Right<AccountLinkTarget>
						>(Either.isRight)(backend.getAdminAccountIDs(backend)(user)),
					),
				),
				errorGenerator('Could not get admin account IDs for member'),
			),
			user.type === 'CAPNHQMember'
				? backend.getMemberEventTags(req.account.id)(toReference(user))
				: asyncRight([], errorGenerator('What?')),
		]).map(([notificationCount, taskCount, linkableAccounts, requirementTags]) => ({
			response: {
				error: MemberCreateError.NONE,
				member: isRioux(user)
					? { ...user, permissions: getDefaultAdminPermissions(req.account.type) }
					: user,
				notificationCount,
				taskCount,
				linkableAccounts: linkableAccounts.filter(({ id }) => id !== req.account.id),
				requirementTags,
			},
			cookies: {
				sessionID: {
					expires: session.expires,
					value: session.id,
				},
			},
		})),
	)(Maybe.And([req.member, req.session]));
};

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[GenBackend<ReturnType<typeof getCombinedMemberBackend>>, PAM.PAMBackend]
	>(getCombinedMemberBackend(), PAM.getPAMBackend),
);
