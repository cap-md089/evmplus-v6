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

import type { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	AsyncEither,
	asyncLeft,
	asyncRight,
	errorGenerator,
	ServerError,
	SessionType,
} from 'common-lib';
import { PAM } from 'server-common';

export const getFormToken: ServerAPIEndpoint<api.FormToken> = PAM.RequireSessionType(
	// tslint:disable-next-line:no-bitwise
	SessionType.REGULAR | SessionType.SCAN_ADD | SessionType.PASSWORD_RESET,
)(req =>
	asyncRight(
		PAM.getTokenForUser(req.mysqlx, req.session.userAccount),
		errorGenerator('Could not get form token'),
	),
);

export function tokenTransformer<T extends PAM.BasicMemberRequest>(
	req: T,
): AsyncEither<ServerError, T> {
	return asyncRight(
		PAM.isTokenValid(req.mysqlx, req.member, req.body.token),
		errorGenerator('Could not validate token'),
	).flatMap(valid =>
		valid
			? asyncRight(req, errorGenerator('Could not validate token'))
			: asyncLeft({
					type: 'OTHER',
					code: 403,
					message: 'Could not validate token',
			  }),
	);
}
