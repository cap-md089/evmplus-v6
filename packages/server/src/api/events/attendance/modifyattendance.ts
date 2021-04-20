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

import { ServerAPIRequestParameter, ServerEither, validator } from 'auto-client-api';
import {
	AccountObject,
	api,
	APIEndpointBody,
	asyncRight,
	destroy,
	errorGenerator,
	hasBasicAttendanceManagementPermission,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	NewAttendanceRecord,
	RawResolvedEventObject,
	RawTeamObject,
	SessionType,
	Validator,
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
import { validateRequest } from '../../../lib/requestUtils';
import wrapper from '../../../lib/wrapper';

type Backend = Backends<
	[AccountBackend, TimeBackend, MemberBackend, TeamsBackend, EventsBackend, AttendanceBackend]
>;

export const attendanceModifyValidator = Validator.Partial(
	(validator<NewAttendanceRecord>(Validator) as Validator<NewAttendanceRecord>).rules,
);

export const getMember = (
	req: ServerAPIRequestParameter<api.events.attendance.ModifyAttendance>,
	backend: Backend,
) => (body: APIEndpointBody<api.events.attendance.ModifyAttendance>) => (
	event: RawResolvedEventObject,
) => (team: MaybeObj<RawTeamObject>) =>
	hasBasicAttendanceManagementPermission(req.member)(event)(team)
		? Maybe.orSome<ServerEither<Member>>(
				asyncRight(req.member, errorGenerator('Could not get member information')),
		  )(Maybe.map(backend.getMember(req.account))(Maybe.fromValue(body.memberID))).filter(
				isAttendanceRecordInScope(backend)(req.account),
				{
					type: 'OTHER',
					code: 403,
					message: 'You do not have permission to modify this attendance record',
				},
		  )
		: asyncRight(req.member, errorGenerator('Could not get member information'));

export const maybeGetTeam = (
	event: RawResolvedEventObject,
	req: ServerAPIRequestParameter<api.events.attendance.ModifyAttendance>,
	backend: Backend,
) =>
	event.teamID === null || event.teamID === undefined
		? asyncRight(Maybe.none(), errorGenerator('Could not get team membership information'))
		: backend.getTeam(req.account)(event.teamID).map(Maybe.some);

export const isAttendanceRecordInScope = (backend: Backend) => (account: AccountObject) => (
	attendanceRecordOwner: MemberReference,
) => backend.getMember(account)(attendanceRecordOwner).flatMap(backend.accountHasMember(account));

export const func: Endpoint<Backend, api.events.attendance.ModifyAttendance> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(request =>
		validateRequest(attendanceModifyValidator)(request).flatMap(req =>
			backend
				.getEvent(req.account)(req.params.id)
				.flatMap(backend.ensureResolvedEvent)
				.flatMap(event =>
					maybeGetTeam(event, req, backend).flatMap(maybeTeam =>
						getMember(
							req,
							backend,
						)(req.body)(event)(maybeTeam).flatMap(member =>
							backend
								.getMemberAttendanceRecordForEvent(event)(member)
								.filter(
									record =>
										Maybe.isSome(record)
											? backend.canMemberModifyRecord(req.member)(
													record.value,
											  )
											: asyncRight(
													true,
													errorGenerator('Could not verify permissions'),
											  ),
									{
										type: 'OTHER',
										code: 403,
										message: 'You do not have permission to do that',
									},
								)
								.flatMap(record =>
									Maybe.isSome(record)
										? backend.applyAttendanceRecordUpdates(req.member)(
												record.value,
										  )({
												...record.value,
												...req.body,
										  })
										: asyncRight(
												void 0,
												errorGenerator('Could not update attendance'),
										  ),
								),
						),
					),
				)
				.map(destroy)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedAttendanceBackend);
