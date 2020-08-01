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

import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../api';
import { MemberReference } from '../../types';

export interface EventAttendanceRecordEventInformation {
	id: number;
	startDateTime: number;
	endDateTime: number;
	location: string;
	name: string;
	attendanceComments: string;
}

export interface EventAttendanceRecord {
	member: {
		reference: MemberReference;
		name: string;
	};
	event: MaybeObj<EventAttendanceRecordEventInformation>;
}

export interface Get {
	(params: {}, body: {}): APIEither<Array<APIEither<EventAttendanceRecord>>>;

	url: '/api/member/attendance';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface GetForGroup {
	(params: {}, body: {}): APIEither<Array<APIEither<MaybeObj<EventAttendanceRecord>>>>;

	url: '/api/member/attendance/group';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface GetForMember {
	(params: { reference: string }, body: {}): APIEither<Array<APIEither<EventAttendanceRecord>>>;

	url: '/api/member/attendance/:reference';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}
