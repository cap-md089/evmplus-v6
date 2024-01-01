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

import {
	api,
	asyncEither,
	asyncIterMap,
	errorGenerator,
	parseStringMemberReference,
	Permissions,
	SessionType,
} from 'common-lib';
import {
	AccountBackend,
	AttendanceBackend,
	Backends,
	EventsBackend,
	getCombinedAttendanceBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';
import { expandRecord } from './basic';

export const func: Endpoint<
	Backends<[EventsBackend, AccountBackend, AttendanceBackend]>,
	api.member.attendance.GetForMember
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission(
			'AttendanceView',
			Permissions.AttendanceView.OTHER,
		)(req =>
			asyncEither(
				parseStringMemberReference(req.params.reference),
				errorGenerator('Could not parse member ID'),
			)
				.flatMap(backend.getAttendanceForMember(req.account))
				.map(asyncIterMap(expandRecord(backend)))
				.map(wrapper),
		),
	);

export default withBackends(func, getCombinedAttendanceBackend());
