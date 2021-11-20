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

import {
	api,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	get,
	hasOneDutyPosition,
	Member,
	Right,
	ServerError,
	SessionType,
} from 'common-lib';
import {
	Backends,
	combineBackends,
	RawMySQLBackend,
	AccountBackend,
	MemberBackend,
	CAP,
	TeamsBackend,
	withBackends,
	BasicAccountRequest,
	getRawMySQLBackend,
	getCombinedMemberBackend,
	PAM,
	generateResults,
} from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

export const func: Endpoint<
	Backends<[RawMySQLBackend, AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]>,
	api.member.MemberSearch
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(req, errorGenerator('Could not validate request'))
			.filter(request => hasOneDutyPosition(['Safety Officer'])(request.member), {
				type: 'OTHER',
				code: 403,
				message: 'You do not have permission to do that',
			})
			.flatMap(req =>
				asyncRight(
					backend.getCollection('NHQ_Member'),
					errorGenerator('Could not get members'),
				)
					.map(collection =>
						collection
							.find(
								'LOWER(NameLast) like :NameLast AND LOWER(NameFirst) like :NameFirst',
							)
							.fields(['CAPID'])
							.bind(
								'NameFirst',
								`%${(req.params.firstName ?? '').toLocaleLowerCase()}%`,
							)
							.bind(
								'NameLast',
								`%${(req.params.lastName ?? '').toLocaleLowerCase()}%`,
							),
					)
					.map(generateResults)
					.map(
						asyncIterMap(({ CAPID }) =>
							backend.getMember(req.account)({
								type: 'CAPNHQMember',
								id: CAPID,
							}),
						),
					)
					.map(
						asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(
							Either.isRight,
						),
					)
					.map(asyncIterMap(get('value')))
					.map(wrapper),
			),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[
			RawMySQLBackend,
			Backends<[AccountBackend, MemberBackend, CAP.CAPMemberBackend, TeamsBackend]>,
		]
	>(getRawMySQLBackend, getCombinedMemberBackend()),
);
