import { AccountObject, FileObject, SigninReturn } from '../../typings/types';
import { APIEither } from '../api';

export * as errors from './errors';
export * as events from './events';
export * as files from './files';
export * as member from './member';
export * as notifications from './notifications';
export * as registry from './registry';
export * as tasks from './tasks';
export * as team from './team';

export interface AccountCheck {
	(params: {}, body: {}): APIEither<AccountObject>;

	url: '/api/accountcheck';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface Check {
	(params: {}, body: {}): APIEither<SigninReturn>;

	url: '/api/check';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface Echo {
	(params: {}, body: any): any;

	url: '/api/echo';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface FormToken {
	(params: {}, body: {}): APIEither<string>;

	url: '/api/token';

	method: 'get';

	requiresMember: 'required';

	needsToken: false;

	useValidator: true;
}

export interface Signin {
	(
		params: {},
		body: {
			username: string;
			password: string;
			recaptcha: string;
		}
	): APIEither<SigninReturn>;

	url: '/api/signin';

	method: 'post';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}

export interface SlideshowImageIDs {
	(params: {}, body: {}): APIEither<FileObject[]>;

	url: '/api/banner';

	method: 'get';

	requiresMember: 'unused';

	needsToken: false;

	useValidator: true;
}
