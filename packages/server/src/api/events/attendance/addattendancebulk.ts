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

import { ServerAPIEndpoint, validator } from 'auto-client-api';
import {
	always,
	api,
	asyncIterHandler,
	asyncIterMap,
	asyncRight,
	canFullyManageEvent,
	collectGeneratorAsync,
	errorGenerator,
	EventObject,
	hasBasicAttendanceManagementPermission,
	Maybe,
	MaybeObj,
	NewAttendanceRecord,
	RawEventObject,
	RawTeamObject,
	ServerError,
	SessionType,
	Validator,
} from 'common-lib';
import {
	addMemberToAttendanceFunc,
	ensureResolvedEvent,
	getAttendanceForEvent,
	getEvent,
	getFullEventObject,
	getTeam,
	PAM,
} from 'server-common';
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

const bulkAttendanceValidator = new Validator({
	members: Validator.ArrayOf(
		Validator.Required(
			(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules,
		),
	),
});

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.attendance.AddBulk> = (
	now = Date.now,
) =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(bulkAttendanceValidator)(request).flatMap(req =>
			getEvent(req.mysqlx)(req.account)(req.params.id)
				.flatMap(ensureResolvedEvent(req.mysqlx))
				.filter(canFullyManageEvent(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member cannot perform this action',
				})
				.flatMap(getFullEventObject(req.mysqlx)(req.account))
				.flatMap<[EventObject, MaybeObj<RawTeamObject>]>(event =>
					!event.teamID
						? asyncRight<ServerError, [EventObject, MaybeObj<RawTeamObject>]>(
								[event, Maybe.none()],
								errorGenerator('Could not get team information'),
						  )
						: getTeam(req.mysqlx)(req.account)(event.teamID).map<
								[EventObject, MaybeObj<RawTeamObject>]
						  >(team => [event, Maybe.some(team)]),
				)

				.flatMap<RawEventObject>(([event, teamMaybe]) =>
					asyncRight(
						collectGeneratorAsync(
							asyncIterMap(
								addMemberToAttendanceFunc(now)(req.mysqlx)(req.account)(event)(
									hasBasicAttendanceManagementPermission(req.member)(event)(
										teamMaybe,
									),
								),
							)(req.body.members),
						),
						errorGenerator('Could not add attendance records'),
					).map(always(event)),
				)

				.flatMap(getAttendanceForEvent(req.mysqlx))
				.map(asyncIterHandler(errorGenerator('Could not get attendance record')))
				.map(wrapper),
		),
	);

export default func();
