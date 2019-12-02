import { api, EitherObj, fromValue, right } from 'common-lib';
import { asyncEitherHandler, BasicAccountRequest, Event } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicAccountRequest) => {
	let nextEvent: Event | null = null;

	for await (const possibleEvent of req.account.getSortedEvents()) {
		if (
			nextEvent === null &&
			possibleEvent.activity[0][5] &&
			possibleEvent.endDateTime > Date.now()
		) {
			nextEvent = possibleEvent;
		}
	}

	const maybeEv = fromValue(nextEvent).map(ev => ev.toRaw());

	return right(maybeEv) as EitherObj<api.ServerError, any>;
});
