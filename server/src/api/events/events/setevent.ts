import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Event from '../../../lib/Event';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(
	async (
		req: MemberValidatedRequest<Partial<NewEventObject>>,
		res: Response
	) => {
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
