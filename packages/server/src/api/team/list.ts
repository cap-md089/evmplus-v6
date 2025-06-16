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
import {
	Backends,
	getCombinedTeamsBackend,
	httpStripTeamObject,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../..';
import wrapper from '../../lib/wrapper';

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

export const func: Endpoint<Backends<[TeamsBackend]>, api.team.ListTeams> = backend => req =>
	backend
		.getTeams(req.account)
		.map(asyncIterMap(backend.expandTeam))
		.map(
			asyncIterFilter<EitherObj<ServerError, FullTeamObject>, Right<FullTeamObject>>(
				Either.isRight,
			),
		)
		.map(asyncIterMap<Right<FullTeamObject>, FullTeamObject>(get('value')))
		.map(asyncIterFilter(isTeamMemberOrLeaderIfPrivate(req.member)))
		.map(asyncIterMap(httpStripTeamObject(req.member)))
		.map(wrapper);

export default withBackends(func, getCombinedTeamsBackend());
