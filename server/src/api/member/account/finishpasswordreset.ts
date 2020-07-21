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
import { always, api, asyncLeft, asyncRight, errorGenerator, PasswordSetResult } from 'common-lib';
import { PAM } from 'server-common';
import {
	addPasswordForUser,
	createSessionForUser,
	getInformationForUser,
	removePasswordValidationToken,
} from 'server-common/dist/member/pam';

const passwordResetErrorMessages = {
	[PasswordSetResult.COMPLEXITY]: 'Password fails to meet complexity requirements',
	[PasswordSetResult.IN_HISTORY]: 'Password has been used too recently',
	[PasswordSetResult.MIN_AGE]: 'Password is not old enough to change',
	[PasswordSetResult.OK]: '',
	[PasswordSetResult.SERVER_ERROR]: 'There was an error with the server',
};

export const func: ServerAPIEndpoint<api.member.account.FinishPasswordReset> = req =>
	PAM.validatePasswordResetToken(req.mysqlx, req.body.token)
		.flatMap(username =>
			asyncRight(
				addPasswordForUser(req.mysqlx, username, req.body.newPassword),
				errorGenerator('Could not add new password')
			).flatMap<string>(setResult =>
				setResult === PasswordSetResult.OK
					? asyncRight(username, errorGenerator('Could not create new session for user'))
					: asyncLeft({
							type: 'OTHER',
							code: 400,
							message: passwordResetErrorMessages[setResult],
					  })
			)
		)
		.flatMap(username =>
			removePasswordValidationToken(req.mysqlx, req.body.token).map(always(username))
		)
		.map(username => getInformationForUser(req.mysqlx, username))
		.flatMap(account => createSessionForUser(req.mysqlx, account))
		.map(session => ({ sessionID: session.id }));

export default func;
