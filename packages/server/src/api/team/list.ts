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
	api,
	asyncIterFilter,
	asyncIterMap,
	Either,
	EitherObj,
	FullTeamObject,
	get,
	hasPermission,
	isPartOfTeam,
	Maybe,
	MaybeObj,
	Permissions,
	pipe,
	Right,
	ServerError,
	TeamPublicity,
	User,
} from 'common-lib';
import { expandTeam, getTeamObjects, httpStripTeamObject } from 'server-common';

const isTeamMemberOrLeaderIfPrivate = (maybeUser: MaybeObj<User>) => (team: FullTeamObject) =>
	team.visibility === TeamPublicity.PRIVATE
		? pipe(
				Maybe.map<User, boolean>(
					user =>
						hasPermission('ManageTeam')(Permissions.ManageTeam.FULL)(user) ||
						isPartOfTeam(user)(team),
				),
				Maybe.orSome(false),
		  )(maybeUser)
		: true;

export const func: ServerAPIEndpoint<api.team.ListTeams> = req =>
	getTeamObjects(req.mysqlx)(req.account)
		.map(asyncIterMap(expandTeam(req.mysqlx)(req.account)))
		.map(
			asyncIterFilter<EitherObj<ServerError, FullTeamObject>, Right<FullTeamObject>>(
				Either.isRight,
			),
		)
		.map(asyncIterMap<Right<FullTeamObject>, FullTeamObject>(get('value')))
		.map(asyncIterFilter(isTeamMemberOrLeaderIfPrivate(req.member)))
		.map(asyncIterMap(httpStripTeamObject(req.member)));

export default func;
