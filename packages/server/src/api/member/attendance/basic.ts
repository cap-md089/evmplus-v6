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

import {
	always,
	api,
	asyncIterMap,
	AttendanceRecord,
	Either,
	errorGenerator,
	Maybe,
	RawResolvedEventObject,
	ServerError,
	SessionType,
	stringifyMemberReference,
	toReference,
	ValidatorError,
} from 'common-lib';
import {
	AccountBackend,
	AttendanceBackend,
	Backends,
	BasicAccountRequest,
	CAP,
	combineBackends,
	EventsBackend,
	getAccountBackend,
	getCombinedAttendanceBackend,
	PAM,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const stripEvent = (record: AttendanceRecord) => (
	event: RawResolvedEventObject,
): api.member.attendance.EventAttendanceRecordEventInformation => ({
	attendanceComments: record.comments,
	endDateTime: event.endDateTime,
	id: event.id,
	location: event.location,
	name: event.name,
	startDateTime: event.startDateTime,
});

export const expandRecord = (backend: Backends<[EventsBackend, AccountBackend]>) => (
	record: AttendanceRecord,
) =>
	backend.getAccount(record.sourceAccountID).flatMap(account =>
		backend
			.getEvent(account)(record.sourceEventID)
			.flatMap(backend.ensureResolvedEvent)
			.map(stripEvent(record))
			.map(Maybe.some)
			.leftFlatMap(always(Either.right(Maybe.none())))
			.map<api.member.attendance.EventAttendanceRecord>(event => ({
				event,
				member: {
					name: record.memberName,
					reference: record.memberID,
				},
			}))
			.leftMap(
				err => ({
					...(err as Exclude<ServerError, ValidatorError>),
					message: `Record could not be shown for ${
						record.memberName
					} (${stringifyMemberReference(record.memberID)})`,
				}),
				errorGenerator(
					`Record could not be shown for ${record.memberName} (${stringifyMemberReference(
						record.memberID,
					)})`,
				),
			),
	);

export const func: Endpoint<
	Backends<[AccountBackend, EventsBackend, AttendanceBackend]>,
	api.member.attendance.Get
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getAttendanceForMember(req.account)(toReference(req.member))
			.map(asyncIterMap(expandRecord(backend)))
			.map(wrapper),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[
			AccountBackend,
			Backends<[CAP.CAPMemberBackend, TeamsBackend, EventsBackend, AttendanceBackend]>,
		]
	>(getAccountBackend, getCombinedAttendanceBackend),
);
