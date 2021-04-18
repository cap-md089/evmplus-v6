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

import { api, EventType, FromDatabase, get, RawRegularEventObject, SessionType } from 'common-lib';
import {
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	getCombinedEventsBackend,
	getTimeBackend,
	PAM,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[TimeBackend, EventsBackend]>,
	api.events.debrief.Delete
> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getEvent(req.account)(req.params.id)
			.filter(
				(event): event is FromDatabase<RawRegularEventObject> =>
					event.type === EventType.REGULAR,
				{
					type: 'OTHER',
					code: 400,
					message: 'You cannot modify the debrief items of a linked event',
				},
			)
			.map(oldEvent => ({
				...oldEvent,
				debrief: oldEvent.debrief.filter(
					({ timeSubmitted }) => timeSubmitted !== parseInt(req.params.timestamp, 10),
				),
			}))
			.flatMap(backend.saveEvent(req.member))
			.map(get('debrief'))
			.map(wrapper),
	);

export default withBackends(
	func,
	combineBackends<BasicAccountRequest, [TimeBackend, EventsBackend]>(
		getTimeBackend,
		getCombinedEventsBackend,
	),
);
