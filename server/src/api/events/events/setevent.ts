import { NewEventObject } from 'common-lib';
import { Response } from 'express';
import Event from '../../../lib/Event';
import { asyncErrorHandler, getTargetMonth, getTargetYear } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<Partial<NewEventObject>>, res: Response) => {
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

		await event.set(req.body, req.account, req.mysqlx);

		await event.save();

		res.status(204);
		res.end();
	}
);
