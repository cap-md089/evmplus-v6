import * as express from 'express';
import { FileObjectValidator } from '..';
import { AccountRequest } from '../../../lib/Account';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';

export default (fileValidator: FileObjectValidator) => (async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		req.is('json') &&
		typeof req.account !== 'undefined' &&
		// typeof req.member !== 'undefined' &&
		typeof req.params.fileid !== 'undefined' &&
		fileValidator(req.body)
	) {
		try {
			const file = await File.Get(req.params.fileid, req.account, req.mysqlx);

			file.set(req.body);

			await file.save();

			res.status(204);
			res.end();
		} catch (e) {
			if (e.message === 'Could not get file') {
				res.status(400);
				res.end();
			} else {
				res.status(500);
				res.end();
			}
		}

	} else {
		res.status(400);
		res.end();
	}
});