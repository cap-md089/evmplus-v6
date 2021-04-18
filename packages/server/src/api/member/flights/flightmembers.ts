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
	always,
	api,
	asyncIterFilter,
	asyncIterHandler,
	asyncLeft,
	asyncRight,
	errorGenerator,
	hasOneDutyPosition,
	isRioux,
	ServerError,
	SessionType,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	CAP,
	combineBackends,
	GenBackend,
	getCombinedMemberBackend,
	getTeamsBackend,
	MemberBackend,
	PAM,
	TeamsBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[MemberBackend, TeamsBackend, AccountBackend, CAP.CAPMemberBackend]>,
	api.member.flight.FlightMembersFull
> = backend =>
	PAM.RequiresMemberType(
		'CAPNHQMember',
		'CAPProspectiveMember',
	)(
		PAM.RequireSessionType(SessionType.REGULAR)(req =>
			(hasOneDutyPosition([
				'Cadet Flight Commander',
				'Cadet Flight Sergeant',
				'Cadet Commander',
				'Cadet Deputy Commander',
				'Cadet Executive Officer',
				'Cadet Deputy Commander',
			])(req.member)
				? asyncRight(req, errorGenerator('Could not process request'))
				: asyncLeft<ServerError, typeof req>({
						type: 'OTHER',
						code: 403,
						message: 'Member does not have permission to do that',
				  })
			)
				.flatMap(() => backend.getMembers(backend)(req.account)())
				.map(asyncIterFilter(mem => !mem.seniorMember))
				.map(
					asyncIterFilter(
						isRioux(req.member)
							? always(true)
							: hasOneDutyPosition([
									'Cadet Flight Commander',
									'Cadet Flight Sergeant',
							  ])(req.member)
							? mem => mem.flight === req.member.flight && mem.flight !== null
							: always(true),
					),
				)
				.map(asyncIterHandler(errorGenerator('Could not get member ID')))
				.map(wrapper),
		),
	);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[GenBackend<typeof getCombinedMemberBackend>, TeamsBackend]
	>(getCombinedMemberBackend, getTeamsBackend),
);
