import * as express from 'express';
import { asyncErrorHandler, File, MemberRequest } from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: MemberRequest<{ fileid: string }>, res: express.Response) => {
		let file;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		await file.delete();

		res.status(204);
		res.end();
	}
);
