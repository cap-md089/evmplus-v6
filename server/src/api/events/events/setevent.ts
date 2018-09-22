import { Response } from 'express';
import Event from '../../../lib/Event';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: MemberRequest, res: Response) => {
	if (req.params.id === 'undefined' || req.body === 'undefined') {
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

	event.set(req.body);

	try {
		await event.save();
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(204);
	res.end();
};
