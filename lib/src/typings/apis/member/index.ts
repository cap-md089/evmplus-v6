import { APIEither } from '../../../typings/api';
import {
	AbsenteeInformation,
	Member,
	MemberReference,
	PasswordSetResult,
} from '../../../typings/types';

export * as account from './account';
export * as attendance from './attendance';
export * as capwatch from './capwatch';
export * as flight from './flight';
export * as permissions from './permissions';
export * as temporarydutypositions from './temporarydutypositions';

export interface SetAbsenteeInformation {
	(params: {}, body: AbsenteeInformation): APIEither<void>;

	url: '/api/member/absent';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface PasswordReset {
	(params: {}, body: { password: string }): APIEither<PasswordSetResult>;

	url: '/api/member/passwordreset';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface Members {
	(params: {}, body: {}): APIEither<Member[]>;

	url: '/api/member';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface Su {
	(params: {}, body: MemberReference): APIEither<void>;

	url: '/api/member/su';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
