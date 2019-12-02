import { just, left, none, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberRequest,
	Event,
	isValidMemberReference,
	MemberBase,
	resolveReference
} from '../../../lib/internals';

export default asyncEitherHandler(
	async (req: BasicMemberRequest<{ timestamp: string; id: string }>) => {
		let event: Event;
		let member: MemberBase;
		const timestamp = parseInt(req.params.timestamp, 10);

		if (timestamp !== timestamp) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Invalid timestamp to delete'
			});
		}

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find event'
			});
		}

		if (isValidMemberReference(req.body) && req.member.isPOCOf(event)) {
			member = await resolveReference(req.body, req.account, req.mysqlx, true);
		} else {
			member = req.member;
		}

		event.removeItemFromDebrief(member, timestamp);

		try {
			await event.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save event'
			});
		}

		return right(event.debrief);
	}
);
