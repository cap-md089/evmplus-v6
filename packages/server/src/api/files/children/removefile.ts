/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	api,
	AsyncEither,
	destroy,
	FileUserAccessControlPermissions,
	get,
	Maybe,
	SessionType,
	userHasFilePermission,
} from 'common-lib';
import { Backends, FileBackend, getCombinedFileBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const canModify = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: Endpoint<Backends<[FileBackend]>, api.files.children.RemoveChild> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		AsyncEither.All([
			backend.getFileObject(req.account)(Maybe.some(req.member))(req.params.parentid),
			backend.getFileObject(req.account)(Maybe.some(req.member))(req.params.childid),
		])
			.filter(
				([parent, child]) => canModify(req.member)(parent) && canRead(req.member)(child),
				{
					type: 'OTHER',
					code: 403,
					message:
						'Member needs to be able to read child and modify parent in order to perform this action',
				},
			)
			.map(get(1))
			.filter(child => child.parentID === req.params.parentid, {
				type: 'OTHER',
				code: 400,
				message: 'Child object is not a child of the requested parent object',
			})
			.map(child => ({
				...child,
				parentID: 'root',
			}))
			.map(backend.saveFileObject)
			.map(destroy)
			.map(wrapper),
	);

export default withBackends(func, getCombinedFileBackend);
