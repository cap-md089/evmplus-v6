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

import {
	api,
	asyncEither,
	CAPProspectiveMemberReference,
	errorGenerator,
	parseStringMemberReference,
	Permissions,
	SessionType,
} from 'common-lib';
import {
	Backends,
	CAP,
	getCombinedMemberBackend,
	MemberBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../../..';
import wrapper from '../../../../lib/wrapper';

export const func: Endpoint<
	Backends<[MemberBackend, CAP.CAPMemberBackend]>,
	api.member.account.capprospective.DeleteProspectiveAccount
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'ProspectiveMemberManagement',
			Permissions.ProspectiveMemberManagement.FULL,
		)(req =>
			asyncEither(
				parseStringMemberReference(req.params.account),
				errorGenerator('Could not parse member reference'),
			)
				.filter(
					(member): member is CAPProspectiveMemberReference =>
						member.type === 'CAPProspectiveMember',
					{
						type: 'OTHER',
						code: 400,
						message: 'Cannot delete a member other than a prospective member',
					},
				)
				.flatMap(backend.getMember(req.account))
				.flatMap(backend.deleteProspectiveMember)
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedMemberBackend);
