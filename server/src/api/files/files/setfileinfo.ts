import * as express from 'express';
import { FileObjectValidator } from '..';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';

export default (fileValidator: FileObjectValidator) => (async (req: MemberRequest, res: express.Response) => {
	if (
		typeof req.member === null
	) {
		res.status(403);
		res.end();
		return;
	}

	if (
		typeof req.params.fileid === 'undefined' ||
		!fileValidator(req.body)
	) {
		res.status(400);
		res.end();
	}

	try {
		const file = await File.Get(req.params.fileid, req.account, req.mysqlx);

		file.set(req.body);

		await file.save();

		res.status(204);
		res.end();
	} catch (e) {
		if (e.message === 'Could not get file') {
			res.status(404);
			res.end();
		} else {
			res.status(500);
			res.end();
		}
	}
});