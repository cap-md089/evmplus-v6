import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase, { MemberRequest } from '../../../lib/MemberBase';
import CAPWATCHMember from '../../../lib/members/CAPWATCHMember';
import { json } from '../../../lib/Util';

export default async (req: MemberRequest, res: Response) => {
	let event: Event;
	let member: MemberBase;

	if (
		req.body === undefined ||
		typeof req.body.comments !== 'string' ||
		typeof req.body.status !== 'string' ||
		typeof req.body.requirements !== 'string' ||
		typeof req.body.planToUseCAPTransportation !== 'boolean' ||
		(req.body.arrivalTime !== undefined &&
			req.body.departureTime !== undefined)
	) {
		if (
			typeof req.body.arrivalTime !== 'number' &&
			typeof req.body.departureTime !== 'number' &&
			req.body.arrivalTime !== undefined &&
			req.body.departureTime !== undefined
		) {
			res.status(400);
			res.end();
			return;
		}
	}

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

	event.addMemberToAttendance(
		{
			arrivalTime: req.body.arrivalTime,
			comments: req.body.comments,
			departureTime: req.body.departureTime,
			planToUseCAPTransportation: req.body.planToUseCAPTransportation,
			requirements: req.body.requirements,
			status: req.body.status
		},
		member
	);

	await event.save();

	json<AttendanceRecord[]>(res, event.attendance);
};
