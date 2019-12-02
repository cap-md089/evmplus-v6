import { just, left, NewEventObject, right } from 'common-lib';
import { asyncEitherHandler, BasicMemberValidatedRequest, Event } from '../../../lib/internals';

export default asyncEitherHandler(async (req: BasicMemberValidatedRequest<NewEventObject>) => {
	try {
		const newEvent = await Event.Create(req.body, req.account, req.mysqlx, req.member);

		return right(newEvent.toRaw(req.member));
	} catch (error) {
		return left({
			code: 500,
			error: just(error),
			message: 'Could not add event'
		});
	}
});
