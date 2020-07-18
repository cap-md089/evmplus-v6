import { APIEither } from '../../../../typings/api';

export * as capnhq from './capnhq';
export * as capprospective from './capprospective';

export interface RegisterDiscord {
	(params: { discordID: string }, body: {}): APIEither<void>;

	url: '/api/member/account/registerdiscord/:discordID';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface PasswordResetRequest {
	(params: {}, body: { username: string; captchaToken: string }): APIEither<void>;

	url: '/api/member/account/requestpasswordreset';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface FinishPasswordReset {
	(params: {}, body: { token: string; newPassword: string }): APIEither<{ sessionID: string }>;

	url: '/api/member/account/finishpasswordreset';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface FinishAccountSetup {
	(params: {}, body: { password: string; token: string; username: string }): APIEither<{
		sessionID: string;
	}>;

	url: '/api/member/account/finishsetup';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
