import { DebriefItem } from 'common-lib';
import { Response } from 'express';
import {
	asyncErrorHandler,
	Event,
	isValidMemberReference,
	json,
	MemberBase,
	MemberRequest,
	resolveReference
} from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberRequest<{ timestamp: string; id: string }>, res: Response) => {
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

		if (isValidMemberReference(req.body) && req.member.isPOCOf(event)) {
			member = await resolveReference(req.body, req.account, req.mysqlx, true);
		} else {
			member = req.member;
		}

		event.removeItemFromDebrief(member, timestamp);

		await event.save();

		json<DebriefItem[]>(res, event.debrief);
	}
);
