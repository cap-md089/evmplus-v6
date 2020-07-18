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
