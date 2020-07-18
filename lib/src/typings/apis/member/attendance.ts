import { MaybeObj } from '../../../lib/Maybe';
import { APIEither } from '../../../typings/api';
import { MemberReference } from '../../../typings/types';

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
