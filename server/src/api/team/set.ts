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

import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	api,
	asyncRight,
	destroy,
	errorGenerator,
	NewTeamObject,
	SessionType,
	Validator,
} from 'common-lib';
import { getTeam, PAM, saveTeam, updateTeam } from 'server-common';
import { validateRequest } from '../../lib/requestUtils';

const teamPartialValidator = Validator.Partial(
	(validator<NewTeamObject>(Validator) as Validator<NewTeamObject>).rules
);

export const func: ServerAPIEndpoint<api.team.SetTeamData> = PAM.RequireSessionType(
	SessionType.REGULAR
)(
	PAM.RequiresPermission('ManageTeam')(request =>
		validateRequest(teamPartialValidator)(request).flatMap(req =>
			getTeam(req.mysqlx)(req.account)(parseInt(req.params.id, 10)).flatMap(oldTeam =>
				asyncRight(
					{
						...oldTeam,
						...req.body,
					},
					errorGenerator('Could not update team')
				)
					.map(updateTeam(req.account)(req.memberUpdateEmitter)(oldTeam))
					.map(saveTeam(req.mysqlx))
					.map(destroy)
			)
		)
	)
);

export default func;
