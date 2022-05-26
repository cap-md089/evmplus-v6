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

import { ServerAPIRequestParameter } from 'auto-client-api';
import {
	always,
	api,
	APIEndpointBody,
	canFullyManageEvent,
	destroy,
	get,
	Maybe,
	MemberReference,
	RawResolvedEventObject,
	SessionType,
	toReference,
} from 'common-lib';
import {
	AccountBackend,
	AttendanceBackend,
	Backends,
	EventsBackend,
	getCombinedAttendanceBackend,
	MemberBackend,
	PAM,
	TeamsBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const getMember = (req: ServerAPIRequestParameter<api.events.attendance.Delete>) => (
	body: APIEndpointBody<api.events.attendance.Delete>,
) => (event: RawResolvedEventObject): MemberReference =>
	canFullyManageEvent(req.member)(event)
		? Maybe.orSome<MemberReference>(toReference(req.member))(Maybe.fromValue(body.member))
		: toReference(req.member);

// export const canDeleteAttendanceRecord = (schema: Schema) => (account: AccountObject) => (
// 	requester: User,
// ) => (member: MemberReference) => (event: RawResolvedEventObject) =>
// 	AsyncEither.All([
// 		resolveReference(schema)(account)(member)
// 			.map(isMemberPartOfAccount({})(schema))
// 			.flatMap(f => f(account)),
// 		event.type !== EventType.LINKED && event.teamID !== null && event.teamID !== undefined
// 			? getTeam(schema)(account)(event.teamID).map(Maybe.some)
// 			: asyncRight(Maybe.none(), errorGenerator('Could not get team information')),
// 	]).map(
// 		([isPartOfAccount, teamMaybe]) =>
// 			isPartOfAccount && hasBasicAttendanceManagementPermission(requester)(event)(teamMaybe),
// 	);

export const func: Endpoint<
	Backends<
		[AccountBackend, TimeBackend, MemberBackend, TeamsBackend, EventsBackend, AttendanceBackend]
	>,
	api.events.attendance.Delete
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getEvent(req.account)(req.params.id)
			.flatMap(backend.ensureResolvedEvent)
			.flatMap(event =>
				backend
					.getMemberAttendanceRecordForEvent(event)(req.body.member)
					.filter(Maybe.isSome, {
						type: 'OTHER',
						code: 404,
						message: 'Member does not have an attendance record',
					})
					.map(get('value'))
					.filter(
						backend.canMemberDeleteRecord(req.member),
						// canDeleteAttendanceRecord(req.mysqlx)(req.account)(req.member)(req.body.member),
						{
							type: 'OTHER',
							code: 403,
							message: 'You do not have permission to perform that action',
						},
					)
					.map(always(event)),
			)
			.flatMap(backend.removeMemberFromEventAttendance(req.member)(req.body.member))
			.map(destroy)
			.map(wrapper),
	);

export default withBackends(func, getCombinedAttendanceBackend());
