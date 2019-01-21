import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Event from '../../../lib/Event';
import { asyncErrorHandler, getTargetMonth, getTargetYear } from '../../../lib/Util';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<Partial<NewEventObject>>,
		res: Response
	) => {
		const eventCount1 = await req.account.getEventCountForMonth(
			getTargetMonth(req.body.pickupDateTime),
			getTargetYear(req.body.pickupDateTime)
		);

		const eventCount2 = await req.account.getEventCountForMonth(
			getTargetMonth(req.body.meetDateTime),
			getTargetYear(req.body.meetDateTime)
		);

		if (
			!req.account.validPaid &&
			(eventCount1 > req.account.unpaidEventLimit ||
				eventCount2 > req.account.unpaidEventLimit)
		) {
			res.status(402);
			return res.end();
		}

		let event: Event;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		event.set(req.body);

		await event.save();

		res.status(204);
		res.end();
	}
);
