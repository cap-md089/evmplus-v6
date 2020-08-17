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

import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	always,
	api,
	asyncIterMap,
	Either,
	errorGenerator,
	Maybe,
	RawEventObject,
	ServerError,
	SessionType,
	stringifyMemberReference,
	toReference,
	ValidatorError,
} from 'common-lib';
import { getAttendanceForMember, getEvent, PAM, RawAttendanceDBRecord } from 'server-common';

const stripEvent = (record: RawAttendanceDBRecord) => (
	event: RawEventObject,
): api.member.attendance.EventAttendanceRecordEventInformation => ({
	attendanceComments: record.comments,
	endDateTime: event.endDateTime,
	id: event.id,
	location: event.location,
	name: event.name,
	startDateTime: event.startDateTime,
});

export const expandRecord = (getEventFunc: typeof getEvent) => (
	req: ServerAPIRequestParameter<api.member.attendance.Get>,
) => (record: RawAttendanceDBRecord) =>
	getEventFunc(req.mysqlx)(req.account)(record.eventID)
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
		);

export const func: ServerAPIEndpoint<api.member.attendance.Get> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	getAttendanceForMember(req.mysqlx)(req.account)(toReference(req.member)).map(
		asyncIterMap(expandRecord(getEvent)(req)),
	),
);

export default func;
