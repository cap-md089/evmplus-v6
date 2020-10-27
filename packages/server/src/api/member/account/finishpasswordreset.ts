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
import { always, api } from 'common-lib';
import { PAM } from 'server-common';
import wrapper from '../../../lib/wrapper';

export const func: ServerAPIEndpoint<api.member.account.FinishPasswordReset> = req =>
	PAM.validatePasswordResetToken(req.mysqlx, req.body.token)
		.flatMap(username =>
			PAM.addPasswordForUser(req.mysqlx, username, req.body.newPassword).map(
				always(username),
			),
		)
		.flatMap(username =>
			PAM.removePasswordValidationToken(req.mysqlx, req.body.token).map(always(username)),
		)
		.map(username => PAM.getInformationForUser(req.mysqlx, username))
		.map(PAM.simplifyUserInformation)
		.flatMap(account => PAM.createSessionForUser(req.mysqlx, account))
		.map(session => ({ sessionID: session.id }))
		.map(wrapper);

export default func;
