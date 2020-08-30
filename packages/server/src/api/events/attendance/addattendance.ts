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
	applyCustomAttendanceFields,
	AsyncEither,
	asyncRight,
	canSignUpForEvent,
	effectiveManageEventPermissionForEvent,
	Either,
	errorGenerator,
	EventObject,
	isValidMemberReference,
	Maybe,
	NewAttendanceRecord,
	Permissions,
	ServerError,
	SessionType,
	toReference,
} from 'common-lib';
import {
	addMemberToAttendance,
	attendanceRecordMapper,
	getEvent,
	getFullEventObject,
	getTeam,
	PAM,
	resolveReference,
} from 'server-common';

const getRecord = (req: ServerAPIRequestParameter<api.events.attendance.Add>) => (
	event: EventObject,
) =>
	(isValidMemberReference(req.body.memberID) &&
	effectiveManageEventPermissionForEvent(req.member)(event) === Permissions.ManageEvent.FULL
		? resolveReference(req.mysqlx)(req.account)(req.body.memberID)
		: asyncRight(req.member, errorGenerator('Could not get member'))
	)
		.map(toReference)
		.map<Required<NewAttendanceRecord>>(memberID => ({
			...req.body,
			customAttendanceFieldValues: applyCustomAttendanceFields(event.customAttendanceFields)(
				req.body.customAttendanceFieldValues,
			),
			shiftTime: req.body.shiftTime ?? null,
			memberID,
		}));

const addAttendance: ServerAPIEndpoint<api.events.attendance.Add> = req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.flatMap(event =>
			AsyncEither.All([
				getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member))(event),
				event.teamID !== undefined && event.teamID !== null
					? getTeam(req.mysqlx)(req.account)(event.teamID).map(Maybe.some)
					: asyncRight(Maybe.none(), errorGenerator('Could not get team information')),
			]),
		)
		.flatMap(([event, teamMaybe]) =>
			getRecord(req)(event)
				.flatMap(rec =>
					Either.map<ServerError, void, Required<NewAttendanceRecord>>(always(rec))(
						Either.leftMap<string, ServerError, void>(err => ({
							type: 'OTHER',
							code: 400,
							message: err,
						}))(canSignUpForEvent(event)(teamMaybe)(rec.memberID)),
					),
				)
				.flatMap(addMemberToAttendance(req.mysqlx)(req.account)(event))
				.map(attendanceRecordMapper),
		);

export const func: ServerAPIEndpoint<api.events.attendance.Add> = PAM.RequireSessionType(
	// tslint:disable-next-line: no-bitwise
	SessionType.REGULAR | SessionType.SCAN_ADD,
)(request =>
	asyncRight(request, errorGenerator('Could not process request'))
		.filter(
			req =>
				!(
					req.session.type === SessionType.SCAN_ADD &&
					(req.session.sessionData.accountID !== req.account.id ||
						req.session.sessionData.eventID.toString() !== req.params.id)
				),
			{
				type: 'OTHER',
				code: 403,
				message: 'Current session cannot add attendance to this event',
			},
		)
		.flatMap(addAttendance),
);

export default func;
