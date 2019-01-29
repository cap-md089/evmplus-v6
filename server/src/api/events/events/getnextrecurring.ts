import { AccountRequest } from "../../../lib/Account";
import Event from "../../../lib/Event";
import { asyncErrorHandler, json } from "../../../lib/Util";

export default asyncErrorHandler(async (req: AccountRequest, res) => {
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

	if (nextEvent === null) {
		res.status(404);
		res.end();
	} else {
		json<EventObject>(res, nextEvent.toRaw());
	}
});