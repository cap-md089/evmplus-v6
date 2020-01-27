import { api, just, left, NewAttendanceRecord, none, Permissions, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	Event,
	isValidMemberReference,
	MemberBase,
	resolveReference
} from '../../../lib/internals';

export default asyncEitherHandler<api.events.attendance.Add>(
	async (req: BasicMemberValidatedRequest<NewAttendanceRecord, { id: string }>) => {
		let event: Event;
		let member: MemberBase;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find event'
			});
		}

		try {
			if (
				isValidMemberReference(req.body.memberID) &&
				(req.member.isPOCOf(event) ||
					req.member.hasPermission('ManageEvent', Permissions.ManageEvent.FULL))
			) {
				member = await resolveReference(req.body.memberID, req.account, req.mysqlx, true);
			} else {
				member = req.member;
			}
		} catch (e) {
			return left({
				code: 404,
				error: just(e),
				message: 'Could not get member specified'
			});
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

			return right(void 0);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save attendance information'
			});
		}
	}
);
