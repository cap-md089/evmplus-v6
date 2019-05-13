import { AttendanceRecord } from 'common-lib';
import { Response } from 'express';
import Event from '../../../lib/Event';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';

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
