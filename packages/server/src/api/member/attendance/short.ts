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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	asyncEitherIterMap,
	AsyncIter,
	asyncIterFilter,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	GroupTarget,
	hasOneDutyPosition,
	hasPermission,
	identity,
	isCAPMember,
	Maybe,
	MaybeObj,
	Member,
	MemberReference,
	memoize,
	Permissions,
	ServerError,
	SessionType,
	toReference,
	User
} from 'common-lib';
import {
	getEvent,
	getLatestAttendanceForMember,
	getMembers,
	PAM,
	RawAttendanceDBRecord
} from 'server-common';
import { expandRecord } from './basic';

const groupTarget = (member: User) => {
	if (hasPermission('AttendanceView')(Permissions.AttendanceView.OTHER)(member)) {
		return GroupTarget.ACCOUNT;
	}

	if (isCAPMember(member)) {
		if (
			member.flight !== null &&
			hasOneDutyPosition(['Cadet Flight Commander', 'Cadet Flight Sergeant'])(member)
		) {
			return GroupTarget.FLIGHT;
		}
	}

	return GroupTarget.NONE;
};

export const func: ServerAPIEndpoint<api.member.attendance.GetForGroup> = PAM.RequireSessionType(
	SessionType.REGULAR
)(req =>
	asyncRight(groupTarget(req.member), errorGenerator('Could not get member attendance'))
		.filter(target => target !== GroupTarget.NONE, {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have permission to get the attendance for a flight or unit'
		})
		.map(target =>
			asyncIterFilter<EitherObj<ServerError, Member>>(
				target === GroupTarget.FLIGHT
					? member => Either.isRight(member) && member.value.flight === req.member.flight
					: Either.isRight
			)(getMembers(req.mysqlx)(req.account))
		)
		.map(asyncEitherIterMap(toReference))
		.map<AsyncIter<EitherObj<ServerError, MaybeObj<RawAttendanceDBRecord>>>>(
			asyncIterMap<
				EitherObj<ServerError, MemberReference>,
				EitherObj<ServerError, MaybeObj<RawAttendanceDBRecord>>
			>(eith =>
				eith.direction === 'right'
					? getLatestAttendanceForMember(req.mysqlx)(req.account)(eith.value)
					: asyncLeft<ServerError, MaybeObj<RawAttendanceDBRecord>>(eith.value)
			)
		)
		.map(
			asyncEitherIterMap<
				MaybeObj<RawAttendanceDBRecord>,
				MaybeObj<api.member.attendance.EventAttendanceRecord>
			>(rec =>
				Maybe.isSome(rec)
					? expandRecord(always(always(memoize(getEvent(req.mysqlx)(req.account)))))(req)(
							rec.value
					  )
							.map(Maybe.some)
							.cata(Maybe.none, identity)
					: Maybe.none()
			)
		)
);

export default func;
