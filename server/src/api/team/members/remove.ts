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

import { APIRequest, ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	destroy,
	errorGenerator,
	MemberReference,
	parseStringMemberReference,
	SessionType,
} from 'common-lib';
import { getTeam, PAM, removeMemberFromTeam, saveTeam } from 'server-common';

const removeMemberFromTeamWithRequest = (req: APIRequest<api.team.members.DeleteTeamMember>) => (
	ref: MemberReference
) =>
	getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10))
		.map(removeMemberFromTeam(req.account)(req.memberUpdateEmitter)(ref))
		.flatMap(saveTeam(req.mysqlx));

export const func: ServerAPIEndpoint<api.team.members.DeleteTeamMember> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(req =>
		asyncEither(
			parseStringMemberReference(req.params.memberid),
			errorGenerator('Could not remove member from team')
		)
			.flatMap(removeMemberFromTeamWithRequest(req))
			.map(destroy)
	)
);

export default func;
