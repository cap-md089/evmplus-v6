import { EventObject } from 'common-lib';
import { Response } from 'express';
import { asyncErrorHandler, ConditionalMemberRequest, Event, json } from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest<{ id: string }>, res: Response) => {
		if (req.params.id === undefined) {
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

		let isValidMember = false;

		if (req.member) {
			for await (const account of req.member.getAccounts()) {
				if (account.id === req.account.id) {
					isValidMember = true;
				}
			}
		}

		json<EventObject>(res, event.toRaw(isValidMember ? req.member : undefined));
	}
);
