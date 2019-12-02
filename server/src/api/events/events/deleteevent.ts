import { api, just, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Event } from '../../../lib/internals';

export default asyncEitherHandler<api.events.events.Delete>(
	async (req: BasicMemberRequest<{ id: string }>) => {
		let event: Event;

		try {
			event = await Event.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Could not find event to delete'
			});
		}

		if (!event.isPOC(req.member)) {
			return left({
				code: 404,
				error: none<Error>(),
				message: 'Member has invalid permissions to perform that action'
			});
		}

		try {
			await event.delete();

			return right(void 0);
		} catch (e) {
			return left({
				code: 500,
				error: just<Error>(e),
				message: 'An unknown server error has occurred'
			});
		}
	}
);
