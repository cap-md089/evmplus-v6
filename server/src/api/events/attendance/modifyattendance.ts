import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import Event from '../../../lib/Event';
import MemberBase from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewAttendanceRecord>, res: Response) => {
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
			MemberBase.isReference(req.body.memberID) &&
			(req.member.hasPermission('SignUpEdit') || event.isPOC(req.member))
		) {
			member = await MemberBase.ResolveReference(
				req.body.memberID,
				req.account,
				req.mysqlx
			);
		} else {
			member = req.member;
		}

		event.modifyAttendanceRecord(
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
	}
);
