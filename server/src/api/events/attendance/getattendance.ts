import { AttendanceRecord } from 'common-lib';
import { Response } from 'express';
import { asyncErrorHandler, Event, json, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res: Response) => {
	let event: Event;

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	json<AttendanceRecord[]>(res, event.attendance);
});
