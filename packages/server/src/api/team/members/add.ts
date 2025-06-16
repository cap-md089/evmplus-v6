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

import { APIRequest } from 'auto-client-api';
import { always, api, destroy, Permissions, RawTeamObject, SessionType } from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	GenBackend,
	getCombinedMemberBackend,
	getTeamsBackend,
	MemberBackend,
	PAM,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const checkIfMemberExists = (backend: Backends<[MemberBackend]>) => (
	req: APIRequest<api.team.members.AddTeamMember>,
) => (team: RawTeamObject) => backend.getMember(req.account)(req.body.reference).map(always(team));

export const func: Endpoint<
	Backends<[TeamsBackend, MemberBackend]>,
	api.team.members.AddTeamMember
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'ManageTeam',
			Permissions.ManageTeam.FULL,
		)(req =>
			backend
				.getTeam(req.account)(parseInt(req.params.id, 10))
				.flatMap(checkIfMemberExists(backend)(req))
				.flatMap(backend.addMemberToTeam(req.body))
				.flatMap(backend.saveTeam)
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[GenBackend<ReturnType<typeof getCombinedMemberBackend>>, TeamsBackend]
	>(getCombinedMemberBackend(), getTeamsBackend),
);
