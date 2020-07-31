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
	FullTeamObject,
	get,
	isPartOfTeam,
	Maybe,
	MaybeObj,
	pipe,
	RawTeamObject,
	Right,
	ServerError,
	TeamPublicity,
	User,
} from 'common-lib';
import { expandTeam, getTeamObjects, httpStripTeamObject } from 'server-common';

const isTeamMemberOrLeaderIfPrivate = (user: MaybeObj<User>) => (team: FullTeamObject) =>
	team.visibility === TeamPublicity.PRIVATE
		? pipe(
				Maybe.map<User, (team: RawTeamObject) => boolean>(isPartOfTeam),
				Maybe.map<(team: RawTeamObject) => boolean, boolean>(call(team)),
				Maybe.orSome(false)
		  )(user)
		: true;

export const func: ServerAPIEndpoint<api.team.ListTeams> = req =>
	getTeamObjects(req.mysqlx)(req.account)
		.map(asyncIterMap(expandTeam(req.mysqlx)(req.account)))
		.map(
			asyncIterFilter<EitherObj<ServerError, FullTeamObject>, Right<FullTeamObject>>(
				Either.isRight
			)
		)
		.map(asyncIterMap<Right<FullTeamObject>, FullTeamObject>(get('value')))
		.map(asyncIterFilter(isTeamMemberOrLeaderIfPrivate(req.member)))
		.map(asyncIterMap(httpStripTeamObject(req.member)));

export default func;
