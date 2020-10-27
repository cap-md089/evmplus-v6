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

import { ServerAPIEndpoint, ServerAPIRequestParameter } from 'auto-client-api';
import {
	always,
	api,
	applyCustomAttendanceFields,
	asyncRight,
	canSignUpForEvent,
	Either,
	errorGenerator,
	EventObject,
	hasBasicAttendanceManagementPermission,
	isValidMemberReference,
	Maybe,
	MaybeObj,
	NewAttendanceRecord,
	RawTeamObject,
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
import wrapper from '../../../lib/wrapper';

const getRecord = (req: ServerAPIRequestParameter<api.events.attendance.Add>) => (
	event: EventObject,
) => (teamMaybe: MaybeObj<RawTeamObject>) =>
	(isValidMemberReference(req.body.memberID) &&
	hasBasicAttendanceManagementPermission(req.member)(event)(teamMaybe)
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
		.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.none())(Maybe.some(req.member)))
		.flatMap(event =>
			(event.teamID !== undefined && event.teamID !== null
				? getTeam(req.mysqlx)(req.account)(event.teamID).map(Maybe.some)
				: asyncRight(Maybe.none(), errorGenerator('Could not get team information'))
			).map(teamMaybe => [event, teamMaybe] as const),
		)
		.flatMap(([event, teamMaybe]) =>
			getRecord(req)(event)(teamMaybe)
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
		)
		.map(wrapper);

export const func: ServerAPIEndpoint<api.events.attendance.Add> = PAM.RequireSessionType(
	SessionType.REGULAR,
	SessionType.SCAN_ADD,
)(request =>
	asyncRight(request, errorGenerator('Could not process request'))
		.filter(
			req =>
				req.session.type === SessionType.REGULAR ||
				(req.session.sessionData.accountID === req.account.id &&
					req.session.sessionData.eventID.toString() === req.params.id),
			{
				type: 'OTHER',
				code: 403,
				message: 'Current session cannot add attendance to this event',
			},
		)
		.flatMap(addAttendance),
);

export default func;
