import { EventObject } from 'common-lib';
import {
	AccountRequest,
	asyncErrorHandler,
	generateResults,
	Registry,
	streamAsyncGeneratorAsJSONArray
} from '../../../lib/internals';

export default asyncErrorHandler(async (req: AccountRequest, res) => {
	const registry = await Registry.Get(req.account, req.mysqlx);

	await streamAsyncGeneratorAsJSONArray<EventObject>(
		res,
		generateResults(
			req.account
				.queryEvents('showUpcoming = true AND endDateTime > :endDateTime', {
					endDateTime: Date.now()
				})
				.sort('endDateTime ASC')
				.limit(registry.values.Website.ShowUpcomingEventCount)
		)
	);
});
