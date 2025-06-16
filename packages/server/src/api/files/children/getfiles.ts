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
	asyncIterFilter,
	asyncIterMap,
	asyncIterTap,
	FileUserAccessControlPermissions,
	Maybe,
	userHasFilePermission,
} from 'common-lib';
import * as debug from 'debug';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	CAP,
	combineBackends,
	FileBackend,
	getCombinedMemberBackend,
	getFileBackend,
	MemberBackend,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const canRead = userHasFilePermission(FileUserAccessControlPermissions.READ);

const logFunc = debug('server:api:files:children:getfiles');

export const func: Endpoint<
	Backends<[AccountBackend, TeamsBackend, FileBackend, MemberBackend, CAP.CAPMemberBackend]>,
	api.files.children.GetBasicFiles
> = backend => req =>
	backend
		.getFileObject(req.account)(req.member)(req.params.parentid)
		.tap(file => logFunc('Got personal drive file %O', file))
		.filter(canRead(Maybe.join(req.member)), {
			type: 'OTHER',
			code: 403,
			message: 'Member cannot read the file requested',
		})
		.flatMap(backend.getChildren(backend)(req.member))
		.map(
			asyncIterTap(file =>
				logFunc.extend('permissions')('Checking file for permissions: %o', file),
			),
		)
		.map(
			asyncIterTap(file =>
				logFunc('Can member read file?', canRead(Maybe.join(req.member))(file)),
			),
		)
		.map(asyncIterFilter(canRead(Maybe.join(req.member))))
		.map(asyncIterMap(backend.expandRawFileObject(req.member)))
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[Backends<[AccountBackend, TeamsBackend, MemberBackend, CAP.CAPMemberBackend]>, FileBackend]
	>(getCombinedMemberBackend(), getFileBackend),
);
