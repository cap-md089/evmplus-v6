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

import { api, get, Maybe } from 'common-lib';
import { Backends, getCombinedPAMBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '../../..';

export const func: Endpoint<
	Backends<[PAM.PAMBackend]>,
	api.member.account.FinishPasswordReset
> = backend => req =>
	backend
		.validatePasswordResetToken(req.body.token)
		.tap(username => backend.addPasswordForUser([username, req.body.newPassword]))
		.tap(() => backend.removePasswordValidationToken(req.body.token))
		.flatMap(backend.getUserInformationForUser)
		.filter(Maybe.isSome, {
			type: 'OTHER',
			code: 400,
			message: 'Could not find member specified',
		})
		.map(get('value'))
		.map(PAM.simplifyUserInformation)
		.flatMap(backend.createSessionForUser)
		.map(session => ({
			response: {},
			cookies: { sessionID: { value: session.id, expires: session.expires } },
		}));

export default withBackends(func, getCombinedPAMBackend);
