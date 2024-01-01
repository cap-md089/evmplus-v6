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

import { api, canFullyManageEvent, SessionType } from 'common-lib';
import {
	Backends,
	EventsBackend,
	getCombinedEventsBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<Backends<[EventsBackend]>, api.events.events.Delete> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getEvent(req.account)(req.params.id)
			.flatMap(backend.ensureResolvedEvent)
			.filter(canFullyManageEvent(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member cannot perform that action',
			})
			.flatMap(backend.deleteEvent(req.member))
			.map(wrapper),
	);

export default withBackends(func, getCombinedEventsBackend());
