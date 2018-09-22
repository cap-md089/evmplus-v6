import { Response } from "express";
import Event from "../../../lib/Event";
import { MemberRequest } from "../../../lib/MemberBase";

export default async (req: MemberRequest, res: Response) => {
	let event: Event;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	try {
		await event.delete();
	} catch(e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(204);
	res.end();
}