/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents how to manage files and folders
 *
 * See `common-lib/src/typings/api.ts` for more information on the
 * API documentation
 *
 * See `common-lib/src/typings/apis/files/children.ts` for more information
 * on the differences between files and folders
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

/**
 * Creates a file with application/folder MIME type
 */
export interface CreateFolder {
	(params: { parentid: string; name: string }, body: {}): APIEither<FullFileObject>;

	url: '/api/files/:parentid/createfolder/:name';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Gets basic file information
 */
export interface GetFile {
	(params: { id: string }, body: {}): APIEither<FileObject>;

	url: '/api/files/:id';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Downloads the raw binary data of a file
 */
export interface GetFileData {
	(params: { id: string }, body: {}): string;

	url: '/api/files/:id/export';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Downloads the raw binary data of a file
 * Sets some headers that tell browsers to download the file as opposed to show it
 */
export interface DownloadFile {
	(params: { id: string }, body: {}): string;

	url: '/api/files/:id/download';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Returns the full information concerning the file, including a full member object
 * for the owner of the file
 */
export interface GetFullFile {
	(params: { id: string }, body: {}): APIEither<FullFileObject>;

	url: '/api/files/:id/dirty';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Fake route just for documentation purposes that details uploading a file
 * Will not work when used like other API routes, but it does exist
 */
export interface UploadFile {
	(): APIEither<FullFileObject>;

	url: '/api/files/upload';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Sets file properties like file name
 */
export interface SetInfo {
	(params: { fileid: string }, body: Partial<EditableFileObjectProperties>): APIEither<void>;

	url: '/api/files/:fileid';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: false;
}

/**
 * Deletes a file
 * Does not recursively delete file children, if applicable
 */
export interface Delete {
	(params: { fileid: string }, body: {}): APIEither<void>;

	url: '/api/files/:fileid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
