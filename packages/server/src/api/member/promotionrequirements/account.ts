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
	asyncIterFilter,
	asyncIterMap,
	asyncIterTap,
	asyncLeft,
	CAPNHQMemberObject,
	Either,
	EitherObj,
	get,
	hasOneDutyPosition,
	hasPermission,
	Maybe,
	Permissions,
	Right,
	ServerError,
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
import saveServerError from '../../../lib/saveServerError';

const hasAllowedDutyPosition = hasOneDutyPosition([
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Commander',
	'Cadet Deputy Commander',
	'Cadet Executive Officer',
	'Deputy Commander For Cadets',
]);

const getPromotionRequirementsForAccount: Endpoint<
	Backends<[TeamsBackend, CAP.CAPMemberBackend]>,
	api.member.promotionrequirements.RequirementsForCadetsInAccount
> = backend => req =>
	backend
		.getNHQMembersInAccount(backend)(req.account)
		.filter(Maybe.isSome, {
			type: 'OTHER',
			code: 400,
			message: 'Account does not have CAP NHQ members',
		})
		.map(get('value'))
		.map(asyncIterFilter(member => !member.seniorMember))
		.map(
			asyncIterMap<
				CAPNHQMemberObject,
				EitherObj<ServerError, api.member.promotionrequirements.PromotionRequrementsItem>
			>(member =>
				backend.getPromotionRequirements(member).map(requirements => ({
					member,
					requirements,
				})),
			),
		)
		.map(
			asyncIterTap(rec =>
				Either.isRight(rec)
					? void 0
					: rec.value.type === 'CRASH'
					? saveServerError(rec.value.error, req)
					: void 0,
			),
		)
		.map(
			asyncIterFilter<
				EitherObj<ServerError, api.member.promotionrequirements.PromotionRequrementsItem>,
				Right<api.member.promotionrequirements.PromotionRequrementsItem>
			>(Either.isRight),
		)
		.map(
			asyncIterMap<
				Right<api.member.promotionrequirements.PromotionRequrementsItem>,
				api.member.promotionrequirements.PromotionRequrementsItem
			>(get('value')),
		)
		.map(wrapper);

export const func: Endpoint<
	Backends<[TeamsBackend, CAP.CAPMemberBackend]>,
	api.member.promotionrequirements.RequirementsForCadetsInAccount
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(req.member) &&
		hasAllowedDutyPosition(req.member)
			? getPromotionRequirementsForAccount(backend)(req)
			: asyncLeft({
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permissions to perform the requested action',
			  }),
	);

export default withBackends(func, getCombinedMemberBackend());
