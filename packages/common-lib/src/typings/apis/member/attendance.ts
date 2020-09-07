/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * This file documents management of attendance from a member
 * standpoint, contrasting with the event API
 *
 * See `common-lib/src/typings/api.ts` for more information
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

import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../api';
import { MemberReference } from '../../types';

/**
 * Contains information about the event pertinent to a member
 */
export interface EventAttendanceRecordEventInformation {
	id: number;
	startDateTime: number;
	endDateTime: number;
	location: string;
	name: string;
	attendanceComments: string;
}

/**
 * Contains wrapped information about an event to include some member information
 */
export interface EventAttendanceRecord {
	member: {
		reference: MemberReference;
		name: string;
	};
	event: MaybeObj<EventAttendanceRecordEventInformation>;
}

/**
 * Gets a personal list of attendance
 */
export interface Get {
	(params: {}, body: {}): APIEither<Array<APIEither<EventAttendanceRecord>>>;

	url: '/api/member/attendance';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets the attendance for a specific group, be that a squadron or flight
 */
export interface GetForGroup {
	(params: {}, body: {}): APIEither<Array<APIEither<MaybeObj<EventAttendanceRecord>>>>;

	url: '/api/member/attendance/group';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets the attendance for the specified member
 *
 * Reference is a member reference formatted according to stringifyMemberReference
 */
export interface GetForMember {
	(params: { reference: string }, body: {}): APIEither<Array<APIEither<EventAttendanceRecord>>>;

	url: '/api/member/attendance/:reference';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}
