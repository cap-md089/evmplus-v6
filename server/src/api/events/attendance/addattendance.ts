import { NewAttendanceRecord } from 'common-lib';
import { Permissions } from 'common-lib';
import { Response } from 'express';
import {
	asyncErrorHandler,
	Event,
	isValidMemberReference,
	MemberBase,
	MemberValidatedRequest,
	resolveReference
} from '../../../lib/internals';

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
			(req.member.isPOCOf(event) ||
				req.member.hasPermission('ManageEvent', Permissions.ManageEvent.FULL))
		) {
			member =
				(await resolveReference(req.body.memberID, req.account, req.mysqlx, false)) ||
				req.member;
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
