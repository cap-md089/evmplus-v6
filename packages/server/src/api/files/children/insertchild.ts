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

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	AsyncEither,
	destroy,
	FileUserAccessControlPermissions,
	get,
	userHasFilePermission
} from 'common-lib';
import { getFileObject, saveFileObject } from 'server-common';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);
const canModify = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export const func: ServerAPIEndpoint<api.files.children.AddChild> = req =>
	AsyncEither.All([
		getFileObject(false)(req.mysqlx)(req.account)(req.params.parentid),
		getFileObject(true)(req.mysqlx)(req.account)(req.body.childid)
	])
		.filter(([parent, child]) => canModify(req.member)(parent) && canRead(req.member)(child), {
			type: 'OTHER',
			code: 403,
			message:
				'Member needs to be able to read child and modify parent in order to perform this action'
		})
		.map(get(1))
		.map(child => ({
			...child,
			parentID: req.params.parentid
		}))
		.map(saveFileObject(req.mysqlx))
		.map(destroy);

export default func;
