import * as express from 'express';
import conf from '../../../conf';
import Event from '../../../lib/Event';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';
import EventValidator from '../../../lib/validator/validators/EventValidator';

const eventValidator = new EventValidator();

export default asyncErrorHandler(
	async (req: MemberRequest, res: express.Response) => {
		if (eventValidator.validate(req.body)) {
			const newEvent = await Event.Create(
				req.body,
				req.account,
				req.mysqlx,
				req.member
			);

			json<EventObject>(res, newEvent.toRaw());
		} else {
			res.status(400);
			if (conf.testing) {
				res.json(eventValidator.getErrors());
			}
			res.end();
		}
	}
);
