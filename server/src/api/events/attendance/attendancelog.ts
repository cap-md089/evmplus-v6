import { Response } from 'express';
import { createWriteStream } from 'fs';
import * as PDFKit from 'pdfkit';
import Event from '../../../lib/Event';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res: Response) => {
	let event: Event;
	const doc = new PDFKit();

	try {
		event = await Event.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	//res.setHeader('Content-Disposition','attachment:filename=log.pdf');
	
	//doc.pipe(createWriteStream('testing.pdf'));
	doc.pipe(res);

	doc.font('Times-Roman')
		.fontSize(30)
		.text('Testing pdf document', 100, 100);

	doc.end();

	//json<AttendanceRecord[]>(res, event.attendance);
});
//http://localhost:3001/api/event/2/attendance/log