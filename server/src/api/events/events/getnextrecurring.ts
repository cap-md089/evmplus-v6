import { api, asyncRight, just, none } from 'common-lib';
import { Account, asyncEitherHandler2, Event, serverErrorGenerator } from '../../../lib/internals';

export default asyncEitherHandler2<api.events.events.GetNextRecurring>(r =>
	asyncRight(r, serverErrorGenerator('Could not get event information'))
		.flatMap(req => Account.RequestTransformer(req))
		.map(async req => {
			let nextEvent = none<Event>();

			for await (const possibleEvent of req.account.getSortedEvents()) {
				if (
					nextEvent === null &&
					possibleEvent.activity[0][5] &&
					possibleEvent.endDateTime > Date.now()
				) {
					nextEvent = just(possibleEvent);
				}
			}

			return nextEvent.map(ev => ev.toRaw());
		})
);
