import { just, left, NewEventObject, none, right } from 'common-lib';
import {
	asyncEitherHandler,
	BasicPartialMemberValidatedRequest,
	Event
} from '../../../lib/internals';

export default asyncEitherHandler(
	async (req: BasicPartialMemberValidatedRequest<NewEventObject, { id: string }>) => {
		let event: Event;

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
			await event.set(req.body, req.account, req.mysqlx, req.member);
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not notify Points of Contact about their status change'
			});
		}

		try {
			await event.save();
		} catch (e) {
			return left({
				code: 500,
				error: just(e),
				message: 'Could not save event information'
			});
		}

		return right(void 0);
	}
);
