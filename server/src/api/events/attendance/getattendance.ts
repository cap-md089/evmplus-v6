import { api, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberRequest, Event } from '../../../lib/internals';

export default asyncEitherHandler<api.events.attendance.GetAttendance>(
	async (req: BasicMemberRequest<{ id: string }>) => {
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

		if (event.privateAttendance && !event.isPOC(req.member)) {
			return right([]);
		}

		return right(event.attendance);
	}
);
