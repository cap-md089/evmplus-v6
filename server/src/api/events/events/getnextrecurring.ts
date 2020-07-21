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
import { api, asyncRight, errorGenerator, Maybe } from 'common-lib';
import { collectResults, queryEventsFind } from 'server-common';

const getNextRecurringQuery = queryEventsFind(
	'activity.values[5].selected = true AND endDateTime > :endDateTime'
);

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.events.GetNextRecurring> = (
	now = Date.now
) => req =>
	asyncRight(
		getNextRecurringQuery(req.mysqlx)(req.account)({
			endDateTime: now(),
		}).limit(1),
		errorGenerator('Could not get event information')
	)
		.map(collectResults)
		.map(Maybe.fromArray);

export default func();
