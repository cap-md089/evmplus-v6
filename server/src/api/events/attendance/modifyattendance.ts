import { NewAttendanceRecord, Permissions } from 'common-lib';
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
		let member: MemberBase | null;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		if (
			isValidMemberReference(req.body.memberID) &&
			(req.member.hasPermission('ManageEvent', Permissions.ManageEvent.FULL) ||
				event.isPOC(req.member))
		) {
			member = await resolveReference(req.body.memberID, req.account, req.mysqlx);

			if (member === null) {
				res.status(404);
				res.end();
				return;
			}
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
