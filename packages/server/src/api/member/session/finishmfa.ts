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

import { api, MemberCreateError, SessionType } from 'common-lib';
import { Backends, getCombinedPAMBackend, PAM, withBackends } from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<Backends<[PAM.PAMBackend]>, api.member.session.FinishMFA> = backend =>
	PAM.RequireSessionType(SessionType.IN_PROGRESS_MFA)(req =>
		backend
			.verifyMFAToken(req.member)(req.body.mfaToken)
			.flatMap(() => backend.checkIfPasswordExpired(req.session.userAccount.username))
			.tap(console.log)
			.tap(passwordExpired =>
				passwordExpired
					? backend.updateSession({
							...req.session,
							type: SessionType.PASSWORD_RESET,
					  })
					: backend.updateSession({
							...req.session,
							type: SessionType.REGULAR,
					  }),
			)
			.map(passwordExpired =>
				passwordExpired
					? (MemberCreateError.PASSWORD_EXPIRED as const)
					: (MemberCreateError.NONE as const),
			)
			.map(wrapper),
	);

export default withBackends(func, getCombinedPAMBackend());
