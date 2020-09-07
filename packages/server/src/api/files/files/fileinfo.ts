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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	FileUserAccessControlPermissions,
	Maybe,
	User,
	userHasFilePermission,
} from 'common-lib';
import { expandRawFileObject, getFileObject } from 'server-common';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const orNull = Maybe.orSome<null | User>(null);

export const func: ServerAPIEndpoint<api.files.files.GetFile> = req =>
	getFileObject(true)(req.mysqlx)(req.account)(req.params.id)
		.filter(canRead(orNull(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member does not have permission to do that',
		})
		.flatMap(expandRawFileObject(req.mysqlx)(req.account));

export default func;
