import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (
	req: AccountRequest & MemberRequest,
	res: express.Response
) => {
	if (
		typeof req.account !== 'undefined' &&
		typeof req.params.fileid !== 'undefined'
	) {
		const file = await File.Get(req.params.fileid, req.account, req.mysqlx);

		try {
			await file.delete();

			res.status(204);
			res.end();
		} catch (e) {
			res.status(500);
			res.end();
		}
	} else {
		res.status(400);
		res.end();
	}
};
