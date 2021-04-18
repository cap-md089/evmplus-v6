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

import { APIRequest } from 'auto-client-api';
import {
	api,
	asyncEither,
	destroy,
	errorGenerator,
	MemberReference,
	parseStringMemberReference,
	Permissions,
	SessionType,
} from 'common-lib';
import { Backends, getCombinedTeamsBackend, PAM, TeamsBackend, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const removeMemberFromTeamWithRequest = (backend: Backends<[TeamsBackend]>) => (
	req: APIRequest<api.team.members.DeleteTeamMember>,
) => (ref: MemberReference) =>
	backend
		.getTeam(req.account)(parseInt(req.params.id, 10))
		.flatMap(backend.removeMemberFromTeam(ref))
		.flatMap(backend.saveTeam);

export const func: Endpoint<
	Backends<[TeamsBackend]>,
	api.team.members.DeleteTeamMember
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'ManageTeam',
			Permissions.ManageTeam.FULL,
		)(req =>
			asyncEither(
				parseStringMemberReference(req.params.memberid),
				errorGenerator('Could not remove member from team'),
			)
				.flatMap(removeMemberFromTeamWithRequest(backend)(req))
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedTeamsBackend);
