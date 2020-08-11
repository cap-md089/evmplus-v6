/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * This file documents how to manage the file links in the drive system
 *
 * See `common-lib/src/typings/api.ts` for more information
 *
 * CAPUnit.com doesn't use folders per se; instead, it has files that have
 * a contentType property of 'application/folder'. Any file can have children.
 * What makes folders unique is that they are rendered differently in the client
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
import { FileObject, FullFileObject } from '../../types';

/**
 * Gets basic information about the children of a file/folder
 * Doesn't include computed properties such as file path or owner
 */
export interface GetBasicFiles {
	(params: { parentid: string }, body: {}): APIEither<Array<APIEither<FileObject>>>;

	url: '/api/files/:parentid/children';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Gets full file information, including computed properties
 */
export interface GetFullFiles {
	(params: { parentid: string }, body: {}): APIEither<Array<APIEither<FullFileObject>>>;

	url: '/api/files/:parentid/children/dirty';

	method: 'get';

	requiresMember: 'optional';

	needsToken: false;

	useValidator: true;
}

/**
 * Takes a parent and requests to add a child to it
 */
export interface AddChild {
	(params: { parentid: string }, body: { childid: string }): APIEither<void>;

	url: '/api/files/:parentid/children';

	method: 'post';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}

/**
 * Delets a link between parent and child, moving child to 'root'
 */
export interface RemoveChild {
	(params: { parentid: string; childid: string }, body: {}): APIEither<void>;

	url: '/api/files/:parentid/children/:childid';

	method: 'delete';

	requiresMember: 'required';

	needsToken: true;

	useValidator: true;
}
