/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ServerAPIEndpoint } from 'auto-client-api';
import {
	always,
	api,
	asyncIterFilter,
	asyncIterHandler,
	asyncIterMap,
	asyncLeft,
	asyncRight,
	Either,
	EitherObj,
	errorGenerator,
	get,
	hasOneDutyPosition,
	isRioux,
	Member,
	Right,
	ServerError,
	SessionType
} from 'common-lib';
import { getMembers, PAM } from 'server-common';

export const func: ServerAPIEndpoint<api.member.flight.FlightMembersFull> = PAM.RequiresMemberType(
	'CAPNHQMember',
	'CAPProspectiveMember'
)(
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		(hasOneDutyPosition([
			'Cadet Flight Commander',
			'Cadet Flight Sergeant',
			'Cadet Commander',
			'Cadet Deputy Commander'
		])
			? asyncRight(req, errorGenerator('Could not process request'))
			: asyncLeft<ServerError, typeof req>({
					type: 'OTHER',
					code: 403,
					message: 'Member does not have permission to do that'
			  })
		)
			.map(() => getMembers(req.mysqlx)(req.account))
			.map(asyncIterFilter<EitherObj<ServerError, Member>, Right<Member>>(Either.isRight))
			.map(asyncIterMap(get('value')))
			.map(asyncIterFilter(mem => !mem.seniorMember))
			.map(
				asyncIterFilter(
					isRioux(req.member)
						? always(true)
						: hasOneDutyPosition(['Cadet Flight Commander', 'Cadet Flight Sergeant'])(
								req.member
						  )
						? mem => mem.flight === req.member.flight && mem.flight !== null
						: always(true)
				)
			)
			.map(asyncIterHandler(errorGenerator('Could not get member ID')))
	)
);

export default func;
