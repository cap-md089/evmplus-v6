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

import { validator } from 'auto-client-api';
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
	AttendanceBackend,
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	GenBackend,
	getCombinedAttendanceBackend,
	getRawMySQLBackend,
	MemberBackend,
	PAM,
	RawMySQLBackend,
	TeamsBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

const bulkAttendanceValidator = new Validator({
	members: Validator.ArrayOf(
		Validator.Required(
			(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules,
		),
	),
});

export const func: Endpoint<
	Backends<
		[
			EventsBackend,
			TeamsBackend,
			RawMySQLBackend,
			TimeBackend,
			MemberBackend,
			AttendanceBackend,
		]
	>,
	api.events.attendance.AddBulk
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(bulkAttendanceValidator)(request).flatMap(req =>
			backend
				.getEvent(req.account)(req.params.id)
				.flatMap(backend.ensureResolvedEvent)
				.filter(canFullyManageEvent(req.member), {
					type: 'OTHER',
					code: 403,
					message: 'Member cannot perform this action',
				})
				.flatMap(backend.getFullEventObject)
				.flatMap<[EventObject, MaybeObj<RawTeamObject>]>(event =>
					!event.teamID
						? asyncRight<ServerError, [EventObject, MaybeObj<RawTeamObject>]>(
								[event, Maybe.none()],
								errorGenerator('Could not get team information'),
						  )
						: backend
								.getTeam(req.account)(event.teamID)
								.map<[EventObject, MaybeObj<RawTeamObject>]>(team => [
									event,
									Maybe.some(team),
								]),
				)

				.flatMap<RawEventObject>(([event, teamMaybe]) =>
					asyncRight(
						collectGeneratorAsync(
							asyncIterMap(
								backend.addMemberToAttendance(event)(
									hasBasicAttendanceManagementPermission(req.member)(event)(
										teamMaybe,
									),
								),
							)(req.body.members),
						),
						errorGenerator('Could not add attendance records'),
					).map(always(event)),
				)

				.flatMap(backend.getAttendanceForEvent)
				.map(asyncIterHandler(errorGenerator('Could not get attendance record')))
				.map(wrapper),
		),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[RawMySQLBackend, GenBackend<typeof getCombinedAttendanceBackend>]
	>(getRawMySQLBackend, getCombinedAttendanceBackend),
);
