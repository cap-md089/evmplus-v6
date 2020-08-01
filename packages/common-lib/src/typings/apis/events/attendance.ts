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

import { APIEither } from '../../api';
import { AttendanceRecord, MemberReference, NewAttendanceRecord } from '../../types';

export interface GetAttendance {
	(params: { id: string }, body: {}): APIEither<Array<APIEither<AttendanceRecord>>>;

	url: '/api/events/:id/attendance';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface Add {
	(params: { id: string }, body: NewAttendanceRecord): APIEither<void>;

	url: '/api/events/:id/attendance';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

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

export interface Delete {
	(params: { id: string }, body: { member?: MemberReference }): APIEither<void>;

	url: '/api/events/:id/attendance';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface ModifyAttendance {
	(params: { id: string }, body: Partial<NewAttendanceRecord>): APIEither<void>;

	url: '/api/events/:id/attendance';

	method: 'put';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}
