import { NewAttendanceRecord } from 'common-lib';
import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase from '../../../lib/member/MemberBase';
import { isValidMemberReference, resolveReference } from '../../../lib/Members';
import { asyncErrorHandler } from '../../../lib/Util';
import { MemberValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewAttendanceRecord, { id: string }>, res: Response) => {
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
			isValidMemberReference(req.body.memberID) &&
			(req.member.hasPermission('SignUpEdit') || event.isPOC(req.member))
		) {
			member = await resolveReference(req.body.memberID, req.account, req.mysqlx);
		} else {
			member = req.member;
		}

		event.modifyAttendanceRecord(
			{
				arrivalTime: req.body.arrivalTime,
				comments: req.body.comments,
				departureTime: req.body.departureTime,
				planToUseCAPTransportation: req.body.planToUseCAPTransportation,
				status: req.body.status,
				canUsePhotos: req.body.canUsePhotos
			},
			member
		);

		await event.save();

		res.status(204);
		res.end();
	}
);
