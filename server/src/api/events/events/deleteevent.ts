import { Response } from "express";
import Event from "../../../lib/Event";
import { MemberRequest } from "../../../lib/MemberBase";
import { asyncErrorHandler } from "../../../lib/Util";

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	let event: Event;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	if (!event.isPOC(req.member)) {
		res.status(403);
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
})