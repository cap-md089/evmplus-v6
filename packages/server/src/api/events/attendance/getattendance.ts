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
	asyncIterHandler,
	canFullyManageEvent,
	errorGenerator,
	SessionType,
} from 'common-lib';
import {
	AccountBackend,
	AttendanceBackend,
	Backends,
	EventsBackend,
	getCombinedAttendanceBackend,
	MemberBackend,
	PAM,
	TeamsBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<
		[AccountBackend, TimeBackend, MemberBackend, TeamsBackend, EventsBackend, AttendanceBackend]
	>,
	api.events.attendance.GetAttendance
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getEvent(req.account)(req.params.id)
			.flatMap(backend.ensureResolvedEvent)
			.filter(event => !event.privateAttendance || canFullyManageEvent(req.member)(event), {
				type: 'OTHER',
				code: 403,
				message: 'Member cannot view private attendance',
			})
			.flatMap(backend.getAttendanceForEvent)
			.map(backend.applyAttendanceFilter(req.member))
			.map(asyncIterHandler(errorGenerator('Could not get attendance records for event')))
			.map(wrapper),
	);

export default withBackends(func, getCombinedAttendanceBackend());
