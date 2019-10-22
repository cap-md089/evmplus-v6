import { NewEventObject } from 'common-lib';
import { Response } from 'express';
import {
	asyncErrorHandler,
	Event,
	getTargetMonth,
	getTargetYear,
	MemberValidatedRequest
} from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<Partial<NewEventObject>, { id: string }>, res: Response) => {
		const eventCount1 =
			req.body.pickupDateTime !== undefined
				? await req.account.getEventCountForMonth(
						getTargetMonth(req.body.pickupDateTime),
						getTargetYear(req.body.pickupDateTime)
				  )
				: 0;

		const eventCount2 =
			req.body.meetDateTime !== undefined
				? await req.account.getEventCountForMonth(
						getTargetMonth(req.body.meetDateTime),
						getTargetYear(req.body.meetDateTime)
				  )
				: 0;

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

		await event.set(req.body, req.account, req.mysqlx, req.member);

		await event.save();

		res.status(204);
		res.end();
	}
);
