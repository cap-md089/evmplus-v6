import { APIEither } from '../../../typings/api';
import { EditableFileObjectProperties, FileObject, FullFileObject } from '../../../typings/types';

export interface CreateFolder {
	(params: { parentid: string; name: string }, body: {}): APIEither<FullFileObject>;

	url: '/api/files/:parentid/createfolder/:name';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface GetFile {
	(params: { id: string }, body: {}): APIEither<FileObject>;

	url: '/api/files/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface GetFileData {
	(params: { id: string }, body: {}): string;

	url: '/api/files/:id/export';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface DownloadFile {
	(params: { id: string }, body: {}): string;

	url: '/api/files/:id/download';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface GetFullFile {
	(params: { id: string }, body: {}): APIEither<FullFileObject>;

	url: '/api/files/:id/dirty';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

export interface UploadFile {
	(): APIEither<FullFileObject>;

	url: '/api/files/upload';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

export interface SetInfo {
	(params: { fileid: string }, body: Partial<EditableFileObjectProperties>): APIEither<void>;

	url: '/api/files/:fileid';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

export interface Delete {
	(params: { fileid: string }, body: {}): APIEither<void>;

	url: '/api/files/:fileid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
