import { api, just, left, none, Permissions, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberRequest,
	Event,
	isValidMemberReference,
	MemberBase,
	resolveReference
} from '../../../lib/internals';

export default asyncEitherHandler<api.events.attendance.Delete>(
	async (req: BasicMemberRequest<{ id: string }>) => {
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

		if (
			isValidMemberReference(req.body) &&
			(req.member.isPOCOf(event) ||
				req.member.hasPermission('ManageEvent', Permissions.ManageEvent.FULL))
		) {
			member = await resolveReference(req.body, req.account, req.mysqlx, true);
		} else {
			member = req.member;
		}

		event.removeMemberFromAttendance(member);

		try {
			await event.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save attendance information'
			});
		}

		return right(event.attendance);
	}
);
