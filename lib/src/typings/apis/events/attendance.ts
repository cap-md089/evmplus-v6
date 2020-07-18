import { APIEither } from '../../../typings/api';
import { AttendanceRecord, MemberReference, NewAttendanceRecord } from '../../../typings/types';

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
