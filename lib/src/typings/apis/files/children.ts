import { APIEither } from '../../../typings/api';
import { FileObject, FullFileObject } from '../../../typings/types';

export interface GetBasicFiles {
	(params: { parentid: string }, body: {}): APIEither<Array<APIEither<FileObject>>>;

	url: '/api/files/:parentid/children';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface GetFullFiles {
	(params: { parentid: string }, body: {}): APIEither<Array<APIEither<FullFileObject>>>;

	url: '/api/files/:parentid/children/dirty';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface AddChild {
	(params: { parentid: string }, body: { childid: string }): APIEither<void>;

	url: '/api/files/:parentid/children';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface RemoveChild {
	(params: { parentid: string; childid: string }, body: {}): APIEither<void>;

	url: '/api/files/:parentid/children/:childid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
