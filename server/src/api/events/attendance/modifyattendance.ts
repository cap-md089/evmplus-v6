import { api, just, left, NewAttendanceRecord, none, Permissions, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	Event,
	isValidMemberReference,
	MemberBase,
	resolveReference
} from '../../../lib/internals';

export default asyncEitherHandler<api.events.attendance.ModifyAttendance>(
	async (req: BasicMemberValidatedRequest<NewAttendanceRecord, { id: string }>) => {
		let event: Event;
		let member: MemberBase | null;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find event'
			});
		}

		if (
			isValidMemberReference(req.body.memberID) &&
			(req.member.hasPermission('ManageEvent', Permissions.ManageEvent.FULL) ||
				event.isPOC(req.member))
		) {
			try {
				member = await resolveReference(req.body.memberID, req.account, req.mysqlx, true);
			} catch (e) {
				return left({
					code: 404,
					error: none<Error>(),
					message: 'Could not find member'
				});
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

		try {
			await event.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save attendance information'
			});
		}

		return right(void 0);
	}
);
