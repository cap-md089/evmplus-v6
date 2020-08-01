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

import { APIEither } from '../../api';
import { EditableFileObjectProperties, FileObject, FullFileObject } from '../../types';

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
