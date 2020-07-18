import { APIEither } from '../../../api';
import { EmailSentType } from '../../../types';

export interface UsernameRequest {
	(
		params: {},
		body: {
			capid: number;
			captchaToken: string;
		}
	): APIEither<void>;

	url: '/api/member/account/capnhq/requestusername';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface RequestNHQAccount {
	(params: {}, body: { capid: number; email: string; recaptcha: string }): APIEither<
		EmailSentType
	>;

	url: '/api/member/account/capnhq/requestaccount';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
