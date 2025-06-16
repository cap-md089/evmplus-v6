/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	api,
	AsyncEither,
	destroy,
	FileUserAccessControlPermissions,
	get,
	Maybe,
	userHasFilePermission,
} from 'common-lib';
import { Backends, FileBackend, getCombinedFileBackend, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const canModify = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: Endpoint<
	Backends<[FileBackend]>,
	api.files.children.AddChild
> = backend => req =>
	AsyncEither.All([
		backend.getFileObject(req.account)(Maybe.some(req.member))(req.params.parentid),
		backend.getFileObject(req.account)(Maybe.some(req.member))(req.body.childid),
	])
		.filter(([parent, child]) => canModify(req.member)(parent) && canRead(req.member)(child), {
			type: 'OTHER',
			code: 403,
			message:
				'Member needs to be able to read child and modify parent in order to perform this action',
		})
		.map(get(1))
		.map(child => ({
			...child,
			parentID: req.params.parentid,
		}))
		.map(backend.saveFileObject)
		.map(destroy)
		.map(wrapper);

export default withBackends(func, getCombinedFileBackend());
