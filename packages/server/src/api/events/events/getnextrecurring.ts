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
	asyncIterMap,
	asyncRight,
	BasicMySQLRequest,
	collectGeneratorAsync,
	Either,
	errorGenerator,
	filterEventInformation,
	Maybe,
} from 'common-lib';
import {
	AccountBackend,
	Backends,
	combineBackends,
	EventsBackend,
	generateResults,
	getAccountBackend,
	getCombinedEventsBackend,
	getRegistryBackend,
	getTimeBackend,
	RegistryBackend,
	TimeBackend,
	withBackends,
} from 'server-common';
import { Endpoint } from '../../..';
import wrapper from '../../../lib/wrapper';

export const func: Endpoint<
	Backends<[TimeBackend, AccountBackend, EventsBackend]>,
	api.events.events.GetNextRecurring
> = backend => req =>
	asyncRight(
		backend
			.queryEvents('activity.values[5] = true AND endDateTime > :endDateTime')(req.account)({
				endDateTime: backend.now(),
			})
			.limit(1),
		errorGenerator('Could not get event information'),
	)
		.map(generateResults)
		.map(asyncIterMap(backend.ensureResolvedEvent))
		.map(collectGeneratorAsync)
		.flatMap(event =>
			event.length === 1
				? Either.isRight(event[0])
					? Either.right(Maybe.some(event[0].value))
					: event[0]
				: Either.right(Maybe.none()),
		)
		.map(Maybe.map(filterEventInformation(Maybe.none())))
		.map(wrapper);

export default withBackends(
	func,
	combineBackends<
		BasicMySQLRequest,
		[TimeBackend, RegistryBackend, AccountBackend, EventsBackend]
	>(getTimeBackend, getRegistryBackend, getAccountBackend, getCombinedEventsBackend()),
);
