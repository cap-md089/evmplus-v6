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

import { validator } from 'auto-client-api';
import {
	api,
	asyncRight,
	destroy,
	errorGenerator,
	NewTeamObject,
	Permissions,
	ServerError,
	SessionType,
	Validator,
} from 'common-lib';
import { Backends, getCombinedTeamsBackend, PAM, TeamsBackend, withBackends } from 'server-common';
import { Endpoint } from '../..';
import { validateRequest } from '../../lib/requestUtils';
import wrapper from '../../lib/wrapper';

const teamPartialValidator = Validator.Partial(
	(validator<NewTeamObject>(Validator) as Validator<NewTeamObject>).rules,
);

export const func: Endpoint<Backends<[TeamsBackend]>, api.team.SetTeamData> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'ManageTeam',
			Permissions.ManageTeam.FULL,
		)(request =>
			validateRequest(teamPartialValidator)(request).flatMap(req =>
				backend
					.getTeam(req.account)(parseInt(req.params.id, 10))
					.flatMap(oldTeam =>
						asyncRight<ServerError, NewTeamObject>(
							{
								cadetLeader: req.body.cadetLeader ?? oldTeam.cadetLeader,
								description: req.body.description ?? oldTeam.description,
								members: req.body.members ?? oldTeam.members,
								name: req.body.name ?? oldTeam.name,
								seniorCoach: req.body.seniorCoach ?? oldTeam.seniorCoach,
								seniorMentor: req.body.seniorMentor ?? oldTeam.seniorMentor,
								visibility: req.body.visibility ?? oldTeam.visibility,
							},
							errorGenerator('Could not update team'),
						)
							.map(backend.updateTeam(req.account)(oldTeam))
							.map(backend.saveTeam)
							.map(destroy)
							.map(wrapper),
					),
			),
		),
	);

export default withBackends(func, getCombinedTeamsBackend());
