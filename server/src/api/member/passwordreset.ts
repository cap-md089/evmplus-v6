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
	always,
	api,
	asyncRight,
	Either,
	errorGenerator,
	PasswordSetResult,
	SessionType,
} from 'common-lib';
import { PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.PasswordReset> = PAM.RequireSessionType(
	// tslint:disable-next-line:no-bitwise
	SessionType.REGULAR | SessionType.PASSWORD_RESET
)(request =>
	asyncRight(request, errorGenerator('Could not reset password for user'))
		.map(req =>
			PAM.addPasswordForUser(req.mysqlx, req.session.userAccount.username, req.body.password)
		)
		.flatMap<PasswordSetResult>(result => {
			if (request.session.type === SessionType.PASSWORD_RESET) {
				return PAM.setSessionType(request.mysqlx, request.session, SessionType.REGULAR).map(
					always(result)
				);
			} else {
				return Either.right(result);
			}
		})
);

export default func;
