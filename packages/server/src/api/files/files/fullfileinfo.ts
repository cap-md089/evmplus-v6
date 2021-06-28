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
	FileUserAccessControlPermissions,
	Maybe,
	User,
	userHasFilePermission,
} from 'common-lib';
import { Backends, FileBackend, getCombinedFileBackend, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const orNull = Maybe.orSome<null | User>(null);

export const func: Endpoint<
	Backends<[FileBackend]>,
	api.files.files.GetFullFile
> = backend => req =>
	backend
		.getFileObject(req.account)(req.member)(req.params.id)
		.filter(canRead(orNull(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have permission to do that',
		})
		.flatMap(backend.expandRawFileObject(req.member))
		.flatMap(backend.expandFileObject)
		.map(wrapper);

export default withBackends(func, getCombinedFileBackend());
