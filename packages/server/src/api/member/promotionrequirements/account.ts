/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of evmplus-v6.
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

import {
	api,
	AsyncEither,
	asyncIterFilter,
	asyncLeft,
	collectGeneratorAsync,
	get,
	hasOneDutyPosition,
	hasPermission,
	Maybe,
	Permissions,
	RawCAPSquadronAccountObject,
	SessionType,
} from 'common-lib';
import {
	Backends,
	CAP,
	getCombinedMemberBackend,
	PAM,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const hasAllowedDutyPosition = hasOneDutyPosition([
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Commander',
	'Cadet Deputy Commander for Operations',
	'Cadet Deputy Commander for Support',
	'Deputy Commander For Cadets',
]);

const getPromotionRequirementsForAccount: (
	sq: RawCAPSquadronAccountObject,
) => Endpoint<
	Backends<[TeamsBackend, CAP.CAPMemberBackend]>,
	api.member.promotionrequirements.RequirementsForCadetsInAccount
> = sq => backend => req =>
	AsyncEither.All([
		backend
			.getNHQMembersInAccount(backend)(req.account)
			.filter(Maybe.isSome, {
				type: 'OTHER',
				code: 400,
				message: 'Account does not have CAP NHQ members',
			})
			.map(get('value'))
			.map(asyncIterFilter(member => !member.seniorMember))
			.map(collectGeneratorAsync),
		backend.getAccountPromotionRequirements(sq),
	])
		.map(([members, promotions]) =>
			members.map(member => ({
				member,
				requirements: promotions[member.id] ?? CAP.emptyCadetPromotionStatus,
			})),
		)
		.map(wrapper);

export const func: Endpoint<
	Backends<[TeamsBackend, CAP.CAPMemberBackend]>,
	api.member.promotionrequirements.RequirementsForCadetsInAccount
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		req.account.type === 'CAPSquadron'
			? hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(
					req.member,
			  ) || hasAllowedDutyPosition(req.member)
				? getPromotionRequirementsForAccount(req.account)(backend)(req)
				: asyncLeft({
						type: 'OTHER',
						code: 403,
						message: 'Member does not have permissions to perform the requested action',
				  })
			: asyncLeft({
					type: 'OTHER',
					code: 400,
					message: 'This operation is only supported for squadrons',
			  }),
	);

export default withBackends(func, getCombinedMemberBackend());
