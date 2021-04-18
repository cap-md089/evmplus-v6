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
	collectGenerator,
	errorGenerator,
	get,
	iterFilter,
	parseStringMemberReference,
	SessionType,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
} from 'common-lib';
import {
	Backends,
	getCombinedMemberBackend,
	MemberBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[MemberBackend]>,
	api.member.temporarydutypositions.GetTemporaryDutyPositions
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		asyncEither(
			parseStringMemberReference(req.params.id),
			errorGenerator('Could not get member information'),
		)
			.flatMap(backend.getMember(req.account))
			.map(get('dutyPositions'))
			.map(
				iterFilter<ShortDutyPosition, ShortCAPUnitDutyPosition>(
					(dutyPosition): dutyPosition is ShortCAPUnitDutyPosition =>
						dutyPosition.type === 'CAPUnit',
				),
			)
			.map(collectGenerator)
			.map(wrapper),
	);

export default withBackends(func, getCombinedMemberBackend);
