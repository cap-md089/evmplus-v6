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
	alwaysTrue,
	api,
	asyncEitherIterMap,
	AsyncIter,
	asyncIterFilter,
	asyncIterMap,
	asyncRight,
	AttendanceRecord,
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
	Permissions,
	ServerError,
	SessionType,
	toReference,
	User,
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

export const func: Endpoint<
	Backends<
		[AccountBackend, CAP.CAPMemberBackend, TeamsBackend, EventsBackend, AttendanceBackend]
	>,
	api.member.attendance.GetForGroup
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncRight(groupTarget(req.member), errorGenerator('Could not get member attendance'))
			.filter(target => target !== GroupTarget.NONE, {
				type: 'OTHER',
				code: 403,
				message:
					'Member does not have permission to get the attendance for a flight or unit',
			})
			.flatMap(target =>
				backend
					.getMembers(backend)(req.account)()
					.map(
						asyncIterFilter<Member>(
							target === GroupTarget.FLIGHT
								? member => member.flight === req.member.flight
								: alwaysTrue,
						),
					),
			)
			.map(asyncIterMap(toReference))
			.map<AsyncIter<EitherObj<ServerError, MaybeObj<AttendanceRecord>>>>(
				asyncIterMap<MemberReference, EitherObj<ServerError, MaybeObj<AttendanceRecord>>>(
					backend.getLatestAttendanceForMember(req.account),
				),
			)
			.map(
				asyncEitherIterMap<
					MaybeObj<AttendanceRecord>,
					MaybeObj<api.member.attendance.EventAttendanceRecord>
				>(rec =>
					Maybe.isSome(rec)
						? expandRecord(backend)(rec.value)
								.map(Maybe.some)
								.cata(Maybe.none, identity)
						: Maybe.none(),
				),
			)
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
	>(getAccountBackend, getCombinedAttendanceBackend()),
);
