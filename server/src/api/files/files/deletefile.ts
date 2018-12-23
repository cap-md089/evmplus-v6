import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: express.Response) => {
	if (typeof req.params.fileid === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	let file;

	try {
		file = await File.Get(req.params.fileid, req.account, req.mysqlx);
	} catch(e) {
		res.status(404);
		res.end();
		return;
	}

	try {
		await file.delete();

		res.status(204);
		res.end();
	} catch (e) {
		console.log(e);
		res.status(500);
		res.end();
	}
});
