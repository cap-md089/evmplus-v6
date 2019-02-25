import { DebriefItem } from 'common-lib';
import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<DebriefItem>, res: Response) => {
		let event: Event;
		let member: MemberBase;

		if (typeof req.body.debriefText !== 'string') {
			res.status(400);
			res.end();
			return;
		}

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		member = req.member;

		event.addItemToDebrief(req.body.debriefText, member);

		await event.save();

		json<DebriefItem[]>(res, event.debrief);
	}
);
