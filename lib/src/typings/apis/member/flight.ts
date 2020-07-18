import { APIEither } from '../../../typings/api';
import { CAPMemberObject, MemberReference } from '../../../typings/types';

export interface Assign {
	(params: {}, body: { member: MemberReference; flight: string | null }): APIEither<void>;

	url: '/api/member/flight';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface AssignBulk {
	(
		params: {},
		// tslint:disable-next-line: array-type
		body: { members: { member: MemberReference; newFlight: string | null }[] }
	): APIEither<void>;

	url: '/api/member/flight/bulk';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface FlightMembersBasic {
	(params: {}, body: {}): APIEither<Array<APIEither<MemberReference>>>;

	url: '/api/members/flight';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface FlightMembersFull {
	(params: {}, body: {}): APIEither<Array<APIEither<CAPMemberObject>>>;

	url: '/api/members/flight/full';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}
