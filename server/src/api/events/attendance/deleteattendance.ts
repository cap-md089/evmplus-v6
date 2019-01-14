import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase, { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	let event: Event;
	let member: MemberBase;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	if (
		MemberBase.isReference(req.body) &&
		req.member.isPOCOf(event)
	) {
		member = await MemberBase.ResolveReference(req.body, req.account, req.mysqlx, true);
	} else {
		member = req.member;
	}

	event.removeMemberFromAttendance(member);

	await event.save();

	json<AttendanceRecord[]>(res, event.attendance);
});
