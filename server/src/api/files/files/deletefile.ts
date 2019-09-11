import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/Members';
import { asyncErrorHandler } from '../../../lib/Util';

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
