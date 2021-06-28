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

import { api, canFullyManageEvent, EventStatus, Maybe, SessionType, toReference } from 'common-lib';
import {
	Backends,
	EventsBackend,
	getCombinedEventsBackend,
	PAM,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<Backends<[EventsBackend]>, api.events.events.Copy> = backend =>
	PAM.RequireSessionType(SessionType.REGULAR)(req =>
		backend
			.getEvent(req.account)(req.params.id)
			.flatMap(backend.ensureResolvedEvent)
			.filter(canFullyManageEvent(req.member), {
				type: 'OTHER',
				code: 403,
				message: 'Member does not have permission to perform that action',
			})
			.map(event => ({
				...event,
				pointsOfContact: event.pointsOfContact.map(poc => ({
					publicDisplay: true,
					...poc,
				})),
			}))
			.map(backend.copyEvent)
			.map(copier => copier(toReference(req.member)))
			.map(copier => copier(req.body.newTime))
			.map(copier =>
				copier(
					Maybe.orSome(EventStatus.INFORMATIONONLY)(Maybe.fromValue(req.body.newStatus)),
				),
			)
			.flatMap(copier => copier(!!req.body.copyFiles))
			.flatMap(backend.getFullEventObject)
			.map(wrapper),
	);

export default withBackends(func, getCombinedEventsBackend());
