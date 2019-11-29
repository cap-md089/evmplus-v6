import { just, none } from 'common-lib';
import { Response } from 'express';
import { asyncErrorHandler, Event, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res: Response) => {
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

	try {
		await event.delete();

		res.json(none());
	} catch (e) {
		res.status(400);
		res.json(just(e.message || e));
	}
});
