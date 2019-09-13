import { AttendanceRecord } from 'common-lib';
import { ManageEvent } from 'common-lib/permissions';
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

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res: Response) => {
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
		isValidMemberReference(req.body) &&
		(req.member.isPOCOf(event) || req.member.hasPermission('ManageEvent', ManageEvent.FULL))
	) {
		member = await resolveReference(req.body, req.account, req.mysqlx, true);
	} else {
		member = req.member;
	}

	event.removeMemberFromAttendance(member);

	await event.save();

	json<AttendanceRecord[]>(res, event.attendance);
});
