import { Response } from 'express';
import Event from '../../../lib/Event';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { json } from '../../../lib/Util';

export default async (req: ConditionalMemberRequest, res: Response) => {
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

	for await (const account of req.member.getAccounts()) {
		if (account.id === req.account.id) {
			isValidMember = true;
		}
	}

	json<EventObject>(res, event.toRaw(isValidMember ? req.member : null));
};
