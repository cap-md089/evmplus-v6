import { Response } from "express";
import Event from "../../../lib/Event";
import { MemberRequest } from "../../../lib/MemberBase";
import { json } from "../../../lib/Util";

export default async (req: MemberRequest, res: Response) => {
	let event: Event;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	json<AttendanceRecord[]>(res, event.attendance);
}