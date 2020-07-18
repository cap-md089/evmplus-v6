import { ServerAPIEndpoint } from 'auto-client-api';
import { api } from 'common-lib';
import { generateResults, getRegistry, queryEventsFind } from 'server-common';

const upcomingQuery = queryEventsFind('showUpcoming = true AND endDateTime > :endDateTime');

export const func: (now?: () => number) => ServerAPIEndpoint<api.events.events.GetUpcoming> = (
	now = Date.now
) => req =>
	getRegistry(req.mysqlx)(req.account)
		.map(registry =>
			upcomingQuery(req.mysqlx)(req.account)({
				endDateTime: now(),
			})
				.sort('endDateTime ASC')
				.limit(registry.Website.ShowUpcomingEventCount)
		)
		.map(generateResults);

export default func();
