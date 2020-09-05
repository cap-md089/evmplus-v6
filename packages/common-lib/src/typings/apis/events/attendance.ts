/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents how to manage event attendance
 *
 * See `common-lib/src/typings/api.ts` for more information
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

import { APIEither } from '../../api';
import { AttendanceRecord, MemberReference, NewAttendanceRecord } from '../../types';

/**
 * Gets the attendance for the event ID specified
 */
export interface GetAttendance {
	(params: { id: string }, body: {}): APIEither<Array<APIEither<AttendanceRecord>>>;

	url: '/api/events/:id/attendance';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

/**
 * Adds a member to attendance.
 *
 * If a member is specified in the request body and the requester has permission, the member in the request body is added
 * Otherwise, the person making the request is added
 */
export interface Add {
	(params: { id: string }, body: NewAttendanceRecord): APIEither<AttendanceRecord>;

	url: '/api/events/:id/attendance';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Adds all the members specified to the attendance for the event
 */
export interface AddBulk {
	(params: { id: string }, body: { members: Array<Required<NewAttendanceRecord>> }): APIEither<
		Array<APIEither<AttendanceRecord>>
	>;

	url: '/api/events/:id/attendance/bulk';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

/**
 * Removes the member from attendance
 *
 * If a member is specified in the request body and the requester has permission, the member in the request body is removed
 * Otherwise, the person making the request is removed
 */
export interface Delete {
	(params: { id: string }, body: { member?: MemberReference }): APIEither<void>;

	url: '/api/events/:id/attendance';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Updates attendance information with the supplied body
 *
 * If a member is specified in the request body and the requester has permission, the attendance for the member
 * in the request body is modified. Otherwise, the person making the request has their attendance modified
 */
export interface ModifyAttendance {
	(params: { id: string }, body: Partial<NewAttendanceRecord>): APIEither<void>;

	url: '/api/events/:id/attendance';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
