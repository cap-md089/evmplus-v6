import { api, left, none, right } from 'common-lib';
import { asyncEitherHandler, BasicConditionalMemberRequest, Event } from '../../../lib/internals';

export default asyncEitherHandler<api.events.events.Get>(
	async (req: BasicConditionalMemberRequest<{ id: string }>) => {
		if (req.params.id === undefined) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Event ID was not specified'
			});
		}

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

		let isValidMember = false;

		if (req.member) {
			for await (const account of req.member.getAccounts()) {
				if (account.id === req.account.id) {
					isValidMember = true;
				}
			}
		}

		return right(event.toRaw(isValidMember ? req.member : null));
	}
);
