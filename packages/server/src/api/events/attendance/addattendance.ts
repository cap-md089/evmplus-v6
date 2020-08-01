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
	api,
	applyCustomAttendanceFields,
	asyncRight,
	destroy,
	effectiveManageEventPermissionForEvent,
	errorGenerator,
	EventObject,
	isValidMemberReference,
	Maybe,
	NewAttendanceRecord,
	Permissions,
	SessionType,
	toReference
} from 'common-lib';
import {
	addMemberToAttendance,
	getEvent,
	getFullEventObject,
	PAM,
	resolveReference
} from 'server-common';

const getRecord = (req: ServerAPIRequestParameter<api.events.attendance.Add>) => (
	event: EventObject
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
				req.body.customAttendanceFieldValues
			),
			shiftTime: req.body.shiftTime ?? null,
			memberID
		}));

export const func: ServerAPIEndpoint<api.events.attendance.Add> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	getEvent(req.mysqlx)(req.account)(req.params.id)
		.flatMap(getFullEventObject(req.mysqlx)(req.account)(Maybe.some(req.member)))
		.flatMap(event =>
			getRecord(req)(event).flatMap(addMemberToAttendance(req.mysqlx)(req.account)(event))
		)
		.map(destroy)
);

export default func;
