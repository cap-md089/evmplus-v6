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

import { APIRequest, ServerAPIEndpoint } from 'auto-client-api';
import { always, api, destroy, Permissions, RawTeamObject, SessionType } from 'common-lib';
import { addMemberToTeam, getTeam, PAM, resolveReference, saveTeam } from 'server-common';

const checkIfMemberExists = (req: APIRequest<api.team.members.AddTeamMember>) => (
	team: RawTeamObject,
) => resolveReference(req.mysqlx)(req.account)(req.body.reference).map(always(team));

export const func: ServerAPIEndpoint<api.team.members.AddTeamMember> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(
	PAM.RequiresPermission(
		'ManageTeam',
		Permissions.ManageTeam.FULL,
	)(req =>
		getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
			.flatMap(checkIfMemberExists(req))
			.map(addMemberToTeam(req.memberUpdateEmitter)(req.account)(req.body))
			.flatMap(saveTeam(req.mysqlx))
			.map(destroy),
	),
);

export default func;
