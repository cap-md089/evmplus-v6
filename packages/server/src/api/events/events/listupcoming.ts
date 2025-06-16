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
	asyncIterFilter,
	asyncIterMap,
	Either,
	EitherObj,
	filterEventInformation,
	get,
	Maybe,
	RawResolvedEventObject,
	Right,
	ServerError,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	BasicAccountRequest,
	combineBackends,
	EventsBackend,
	generateResults,
	getCombinedEventsBackend,
	getDefaultAccountBackend,
	getRegistryBackend,
	getTimeBackend,
	RegistryBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

const upcomingQuery = '(showUpcoming = true OR type = "Linked") AND pickupDateTime > :endDateTime';

export const func: Endpoint<
	Backends<[TimeBackend, AccountBackend, EventsBackend, RegistryBackend]>,
	api.events.events.GetUpcoming
> = backend => req =>
	backend
		.getRegistry(req.account)
		.map(registry =>
			backend
				.queryEvents(upcomingQuery)(req.account)({
					endDateTime: backend.now(),
				})
				.sort('pickupDateTime ASC')
				.limit(registry.Website.ShowUpcomingEventCount),
		)
		.map(generateResults)
		.map(asyncIterMap(backend.ensureResolvedEvent))
		.map(
			asyncIterFilter<
				EitherObj<ServerError, RawResolvedEventObject>,
				Right<RawResolvedEventObject>
			>(Either.isRight),
		)
		.map(asyncIterMap(get('value')))
		.map(asyncIterMap(filterEventInformation(Maybe.none())))
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicAccountRequest,
		[TimeBackend, AccountBackend, EventsBackend, RegistryBackend]
	>(getTimeBackend, getDefaultAccountBackend(), getCombinedEventsBackend(), getRegistryBackend),
);
