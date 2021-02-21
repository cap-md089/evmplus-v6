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
	asyncEither,
	asyncIterFilter,
	asyncIterMap,
	errorGenerator,
	FileUserAccessControlPermissions,
	Maybe,
	userHasFilePermission,
} from 'common-lib';
import { expandFileObject, expandRawFileObject, getChildren, getFileObject } from 'server-common';
import wrapper from '../../../lib/wrapper';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);

export const func: ServerAPIEndpoint<api.files.children.GetFullFiles> = req =>
	getFileObject(req.mysqlx)(req.account)(req.member)(req.params.parentid)
		.filter(canRead(Maybe.join(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot read the file requested',
		})
		.flatMap(getChildren(req.mysqlx)(req.account)(req.member))
		.map(asyncIterFilter(canRead(Maybe.join(req.member))))
		.map(asyncIterMap(expandRawFileObject(req.mysqlx)(req.account)(req.member)))
		.map(
			asyncIterMap(file =>
				asyncEither(file, errorGenerator('Could not get full file information')).flatMap(
					expandFileObject(req.mysqlx)(req.account),
				),
			),
		)
		.map(wrapper);

export default func;
