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
import { api, asyncRight, errorGenerator } from 'common-lib';
import { PAM } from 'server-common';
import { simplifyUserInformation } from 'server-common/dist/member/pam';

export const func: ServerAPIEndpoint<api.member.account.FinishAccountSetup> = req =>
	asyncRight(
		PAM.validateUserAccountCreationToken(req.mysqlx, req.body.token),
		errorGenerator('Could not find token'),
	)
		.map(
			member =>
				PAM.addUserAccount(
					req.mysqlx,
					req.account,
					req.body.username,
					req.body.password,
					member,
					req.body.token,
				),
			error =>
				error instanceof PAM.UserError
					? {
							type: 'OTHER',
							code: 400,
							message: error.message,
					  }
					: {
							type: 'CRASH',
							code: 500,
							error,
							message:
								'An unknown error occurred while trying to finish creating your account',
					  },
		)
		.map(simplifyUserInformation)
		.flatMap(account => PAM.createSessionForUser(req.mysqlx, account))
		.map(({ id }) => ({ sessionID: id }));

export default func;
