import { just, NewAttendanceRecord, none, Permissions } from 'common-lib';
import {
	asyncErrorHandler,
	Event,
	isValidMemberReference,
	MemberBase,
	MemberValidatedRequest,
	resolveReference
} from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewAttendanceRecord, { id: string }>, res, next) => {
		let event: Event;
		let member: MemberBase;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.json(just('Could not find event'));
			return;
		}

		try {
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
		} catch (e) {
			res.status(500);
			res.json(just('Could not get member specified'));
			return next(e);
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

		try {
			await event.save();

			res.status(204);
			res.json(none());
		} catch (e) {
			res.status(500);
			res.json(just('Could not save attendance information'));
		}
	}
);
