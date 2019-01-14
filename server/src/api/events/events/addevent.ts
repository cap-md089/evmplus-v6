import * as express from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Event from '../../../lib/Event';
import {
	asyncErrorHandler,
	getTargetMonth,
	getTargetYear,
	json
} from '../../../lib/Util';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<NewEventObject>,
		res: express.Response
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

		const newEvent = await Event.Create(
			req.body,
			req.account,
			req.mysqlx,
			req.member
		);

		json<EventObject>(res, newEvent.toRaw());
	}
);
