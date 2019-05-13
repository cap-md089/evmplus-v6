import { NewAttendanceRecord } from 'common-lib';
import { Response } from 'express';
import Event from '../../../lib/Event';
import MemberBase from '../../../lib/MemberBase';
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

		// DO NOT MOVE THIS INTO THE IF STATEMENT
		// For some reason it does not work, it needs to be
		// stored in a variable first
		const canAddOtherMembers =
			req.body.memberID &&
			MemberBase.isReference(req.body.memberID) &&
			req.member.isPOCOf(event);

		if (canAddOtherMembers) {
			member =
				(await MemberBase.ResolveReference(
					req.body.memberID,
					req.account,
					req.mysqlx,
					true
				)) || req.member;
		} else {
			member = req.member;
		}

		event.addMemberToAttendance(
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
