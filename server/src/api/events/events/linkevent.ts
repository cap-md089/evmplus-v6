import { EventObject } from 'common-lib';
import { Response } from 'express';
import Account from '../../../lib/Account';
import Event from '../../../lib/Event';
import MemberBase, { MemberRequest } from '../../../lib/Members';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ parent: string }>, res: Response) => {
	if (req.body === undefined || typeof req.body.id !== 'string' || req.params.parent === undefined) {
		res.status(400);
		res.end();
		return;
	}

	let event: Event;
	let targetAccount: Account;

	try {
		[event, targetAccount] = await Promise.all([
			Event.Get(req.params.parent, req.account, req.mysqlx),
			Account.Get(req.body.id, req.mysqlx)
		]);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	const memCopy = await MemberBase.ResolveReference(
		req.member.getReference(),
		targetAccount,
		req.mysqlx
	);

	if (!memCopy.hasPermission('AddEvent', 2)) {
		res.status(403);
		res.end();
		return;
	}

	const newEvent = await event.linkTo(targetAccount, req.member);

	res.status(200);
	json<EventObject>(res, newEvent.toRaw());
});
