import { EventObject } from 'common-lib';
import { DateTime } from 'luxon';
import { asyncErrorHandler, Event, json, MemberRequest, Validator } from '../../../lib/internals';

const validator = new Validator({
	newTime: {
		validator: Validator.Number
	},
	copyStatus: {
		validator: Validator.Or(Validator.Boolean, Validator.Nothing)
	},
	copyFiles: {
		validator: Validator.Or(Validator.Boolean, Validator.Nothing)
	}
});

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res) => {
	if (!validator.validate(req.body)) {
		res.status(400);
		res.end();
		return;
	}

	let event: Event;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	if (!event.isPOC(req.member)) {
		res.status(403);
		res.end();
		return;
	}

	const newEvent = await event.copy(
		DateTime.fromMillis(req.body.newTime),
		req.member,
		!!req.body.copyStatus,
		!!req.body.copyFiles
	);

	json<EventObject>(res, newEvent.toRaw(req.member));
});
