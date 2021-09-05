/**
 * Copyright (C) 2020 Glenn Rioux
 *
 * This file is part of emv6.
 *
 * emv6 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * emv6 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with emv6.  If not, see <http://www.gnu.org/licenses/>.
 */

import { api, SessionType } from 'common-lib';
import { Backends, getCombinedMemberBackend, PAM, withBackends } from 'server-common';
import { CAPMemberBackend } from 'server-common/src/member/members/cap';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[CAPMemberBackend]>,
	api.member.promotionrequirements.RequirementsForCurrentUser
> = backend =>
	PAM.RequiresMemberType('CAPNHQMember')(
		PAM.RequireSessionType(SessionType.REGULAR)(req =>
			backend.getPromotionRequirements(req.member).map(wrapper),
		),
	);

export default withBackends(func, getCombinedMemberBackend());
