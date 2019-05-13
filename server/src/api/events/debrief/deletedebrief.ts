import { DebriefItem } from 'common-lib';
import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase, { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ timestamp: string, id: string }>, res: Response) => {
	let event: Event;
	let member: MemberBase;
	const timestamp = parseInt(req.params.timestamp, 10);

	if (timestamp !== timestamp) {
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

	if (MemberBase.isReference(req.body) && req.member.isPOCOf(event)) {
		member = await MemberBase.ResolveReference(req.body, req.account, req.mysqlx, true);
	} else {
		member = req.member;
	}

	event.removeItemFromDebrief(member, timestamp);

	await event.save();

	json<DebriefItem[]>(res, event.debrief);
});
