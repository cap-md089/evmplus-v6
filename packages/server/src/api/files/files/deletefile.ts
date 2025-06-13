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

import { api, FileUserAccessControlPermissions, Maybe, userHasFilePermission } from 'common-lib';
import { Backends, FileBackend, getCombinedFileBackend, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canDeleteFile = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: Endpoint<Backends<[FileBackend]>, api.files.files.Delete> = backend => req =>
	backend
		.getFileObject(req.account)(Maybe.some(req.member))(req.params.fileid)
		.filter(canDeleteFile(req.member), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot delete file',
		})
		.flatMap(backend.deleteFileObject)
		.map(wrapper);

export default withBackends(func, getCombinedFileBackend());
