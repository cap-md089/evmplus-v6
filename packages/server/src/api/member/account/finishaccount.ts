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

import { api } from 'common-lib';
import { Backends, getCombinedPAMBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '../../..';

export const func: Endpoint<
	Backends<[PAM.PAMBackend]>,
	api.member.account.FinishAccountSetup
> = backend => req =>
	backend
		.validateUserAccountCreationToken(req.body.token)
		.flatMap(member =>
			backend.addUserAccount(req.account)(member)([req.body.username, req.body.password])(
				req.body.token,
			),
		)
		.map(PAM.simplifyUserInformation)
		.flatMap(backend.createSessionForUser)
		.map(({ id, expires }) => ({
			response: {},
			cookies: {
				sessionID: {
					expires,
					value: id,
				},
			},
		}));

export default withBackends(func, getCombinedPAMBackend);
