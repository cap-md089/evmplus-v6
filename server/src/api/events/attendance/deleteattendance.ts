import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase, { MemberRequest } from '../../../lib/MemberBase';
import { CAPWATCHMember } from '../../../lib/Members';
import { json } from '../../../lib/Util';

export default async (req: MemberRequest, res: Response) => {
	let event: Event;
	let member: MemberBase;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	if (req.body.id !== undefined && req.member.hasPermission('SignUpEdit')) {
		member = await CAPWATCHMember.Get(req.body.id, req.account, req.mysqlx);
	} else {
		member = req.member;
	}

	event.removeMemberFromAttendance(member);

	await event.save();

	json<AttendanceRecord[]>(res, event.attendance);
};
