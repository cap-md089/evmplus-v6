/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { api, asyncEither, destroy, errorGenerator, Permissions, SessionType } from 'common-lib';
import {
	Backends,
	CAP,
	getCombinedMemberBackend,
	MemberBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[CAP.CAPMemberBackend, MemberBackend]>,
	api.member.flight.Assign
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'FlightAssign',
			Permissions.FlightAssign.YES,
		)(req =>
			backend
				.getMember(req.account)(req.body.member)
				.map(member => ({
					...member,
					flight: req.body.flight,
				}))
				.flatMap(member =>
					asyncEither(
						CAP.getExtraMemberInformationForCAPMember(req.account)(member),
						errorGenerator('Could not save flight information'),
					)
						.flatMap(backend.saveExtraMemberInformation)
						.tap(() =>
							req.memberUpdateEmitter.emit('memberChange', {
								member,
								account: req.account,
							}),
						)
						.map(destroy)
						.map(wrapper),
				),
		),
	);

export default withBackends(func, getCombinedMemberBackend());
