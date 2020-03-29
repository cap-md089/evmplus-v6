import { api, asyncRight, EventObject, just, none } from 'common-lib';
import {
	Account,
	asyncEitherHandler2,
	collectResults,
	serverErrorGenerator
} from '../../../lib/internals';

export default asyncEitherHandler2<api.events.events.GetNextRecurring>(r =>
	asyncRight(r, serverErrorGenerator('Could not get event information'))
		.flatMap(req => Account.RequestTransformer(req))
		.map(async req => {
			const queryResults = await collectResults(
				req.account
					.queryEvents(
						'activity.values[5].selected = true AND endDateTime > :endDateTime',
						{ endDateTime: Date.now() }
					)
					.limit(1)
			);

			return queryResults.length === 1 ? just(queryResults[0]) : none<EventObject>();
		})
);
