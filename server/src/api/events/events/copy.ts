import { left, none, right } from 'common-lib';
import { DateTime } from 'luxon';
import { asyncEitherHandler, BasicMemberRequest, Event, Validator } from '../../../lib/internals';

export const copyValidator = new Validator({
	newTime: {
		validator: Validator.Number
	},
	copyStatus: {
		validator: Validator.Or(Validator.Boolean, Validator.Nothing),
		required: false
	},
	copyFiles: {
		validator: Validator.Or(Validator.Boolean, Validator.Nothing),
		required: false
	}
});

export default asyncEitherHandler(async (req: BasicMemberRequest<{ id: string }>) => {
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

	if (!event.isPOC(req.member)) {
		return left({
			code: 404,
			error: none<Error>(),
			message: 'Member has invalid permissions to perform that action'
		});
	}

	const newEvent = await event.copy(
		DateTime.fromMillis(req.body.newTime),
		req.member,
		!!req.body.copyStatus,
		!!req.body.copyFiles
	);

	return right(newEvent.toRaw(req.member));
});
