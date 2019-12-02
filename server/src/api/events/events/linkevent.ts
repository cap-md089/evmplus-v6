import { api, left, none, right } from 'common-lib';
import {
	Account,
	asyncEitherHandler,
	BasicMemberRequest,
	Event,
	getPermissionsForMemberInAccount
} from '../../../lib/internals';

export default asyncEitherHandler<api.events.events.Link>(
	async (req: BasicMemberRequest<{ parent: string }>) => {
		if (
			req.body === undefined ||
			req.body === null ||
			typeof req.body.id !== 'string' ||
			req.params.parent === undefined
		) {
			return left({
				code: 400,
				error: none<Error>(),
				message: 'Linked event target and source could not be found'
			});
		}

		let event: Event;
		let targetAccount: Account;

		try {
			[event, targetAccount] = await Promise.all([
				Event.Get(req.params.parent, req.account, req.mysqlx),
				Account.Get(req.body.id, req.mysqlx)
			]);
		} catch (e) {
			return left({
				code: 404,
				error: none<Error>(),
				message: "Either the account or the event couldn't be found"
			});
		}

		const permissionsForMemberInTargetAccount = await getPermissionsForMemberInAccount(
			req.mysqlx,
			req.member.getReference(),
			targetAccount
		);

		if (permissionsForMemberInTargetAccount.ManageEvent < 2) {
			return left({
				code: 403,
				error: none<Error>(),
				message: 'This account does not have permissions to perform this action'
			});
		}

		const newEvent = await event.linkTo(targetAccount, req.member);

		return right(newEvent.toRaw(req.member));
	}
);
