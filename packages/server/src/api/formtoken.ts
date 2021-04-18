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

import { api, AsyncEither, asyncLeft, asyncRight, errorGenerator, ServerError } from 'common-lib';
import { Backends, getCombinedPAMBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '..';
import wrapper from '../lib/wrapper';

export const getFormTokenFunc: Endpoint<
	Backends<[PAM.PAMBackend]>,
	api.FormToken
> = backend => req => backend.getTokenForUser(req.session.userAccount).map(wrapper);

export const getFormToken = withBackends(getFormTokenFunc, getCombinedPAMBackend);

export const tokenTransformer = (backendGenerator = getCombinedPAMBackend) => <
	T extends PAM.BasicMemberRequest
>(
	req: T,
): AsyncEither<ServerError, T> => {
	const backend = backendGenerator(req);

	return backend
		.isTokenValid(req.member)(req.body.token)
		.flatMap(valid =>
			valid
				? asyncRight(req, errorGenerator('Could not validate token'))
				: asyncLeft({
						type: 'OTHER',
						code: 403,
						message: 'Could not validate token',
				  }),
		);
};
