import { Response } from "express";
import Account from "../../../lib/Account";
import Event from "../../../lib/Event";
import { MemberRequest } from "../../../lib/MemberBase";
import { json } from "../../../lib/Util";

export default async (req: MemberRequest, res: Response) => {
	if (
		req.body === undefined ||
		req.body.id === undefined ||
		req.params.parent === undefined
	) {
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

	let newEvent: Event;

	try {
		newEvent = await event.linkTo(targetAccount, req.member);
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(200)
	json<EventObject>(res, newEvent.toRaw());
}