import { api, DebriefItem, just, left, none, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicMemberValidatedRequest,
	Event,
	MemberBase
} from '../../../lib/internals';

export default asyncEitherHandler<api.events.debrief.Add>(
	async (req: BasicMemberValidatedRequest<DebriefItem, { id: string }>) => {
		let event: Event;
		let member: MemberBase;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not get debrief item'
			});
		}

		member = req.member;

		event.addItemToDebrief(req.body.debriefText, member);

		try {
			await event.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save debrief items'
			});
		}

		return right(event.debrief);
	}
);
