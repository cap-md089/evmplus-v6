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
import { api, asyncRight, errorGenerator, SessionType, StoredMemberPermissions } from 'common-lib';
import { findAndBindC, generateResults, PAM } from 'server-common';
import wrapper from '../../../lib/wrapper';

export const func: ServerAPIEndpoint<api.member.permissions.GetPermissions> = PAM.RequireSessionType(
	SessionType.REGULAR,
)(req =>
	asyncRight(
		req.mysqlx.getCollection<StoredMemberPermissions>('UserPermissions'),
		errorGenerator('Could not get member permissions'),
	)
		.map(
			findAndBindC<StoredMemberPermissions>({ accountID: req.account.id }),
		)
		.map(generateResults)
		.map(wrapper),
);

export default func;
