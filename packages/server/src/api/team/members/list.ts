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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncIterFilter,
	asyncIterMap,
	call,
	Either,
	EitherObj,
	get,
	isPartOfTeam,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	pipe,
	RawTeamObject,
	Right,
	ServerError,
	SessionType,
	TeamPublicity,
	User
} from 'common-lib';
import { getTeam, PAM, resolveReference } from 'server-common';

const canMemberViewPrivateTeam = (member: MaybeObj<User>) => (team: RawTeamObject) =>
	team.visibility === TeamPublicity.PRIVATE
		? pipe(
				Maybe.map<User, (team: RawTeamObject) => boolean>(isPartOfTeam),
				Maybe.map<(team: RawTeamObject) => boolean, boolean>(call(team)),
				Maybe.orSome(false)
		  )(member)
		: true;

const canMemberViewProtectedTeam = (member: MaybeObj<User>) => (team: RawTeamObject) =>
	team.visibility === TeamPublicity.PROTECTED ? member.hasValue : true;

const getTeamMembersList = (team: RawTeamObject): MemberReference[] =>
	[
		...team.members.map(get('reference')).map(Maybe.some),
		team.cadetLeader,
		team.seniorCoach,
		team.seniorMentor
	]
		.filter(Maybe.isSome)
		.map(get('value'));

export const func: ServerAPIEndpoint<api.team.members.ListTeamMembers> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
		.filter(canMemberViewPrivateTeam(req.member), {
			type: 'OTHER',
			code: 403,
			message:
				'Member does not have permission to view the member information of a private team'
		})
		.filter(canMemberViewProtectedTeam(req.member), {
			type: 'OTHER',
			code: 403,
			message:
				'Member does not have permission to view the member information of a protected team'
		})
		.map(getTeamMembersList)
		.map(asyncIterMap(resolveReference(req.mysqlx)(req.account)))
		.map(asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight))
		.map(asyncIterMap(get('value')))
);

export default func;
