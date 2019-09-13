import { FileObject, FullFileObject } from 'common-lib';
import { FileUserAccessControlPermissions } from 'common-lib/index';
import * as express from 'express';
import { asyncErrorHandler, ConditionalMemberRequest, File, json } from '../../../lib/internals';

export default asyncErrorHandler(
	async (
		req: ConditionalMemberRequest<{ method: string; fileid: string }>,
		res: express.Response
	) => {
		let file: File;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		if (
			!(await file.hasPermission(
				req.member,
				req.mysqlx,
				req.account,
				FileUserAccessControlPermissions.READ
			))
		) {
			res.send(403);
			res.end();
			return;
		}

		if (req.params.method && req.params.method === 'dirty') {
			json<FullFileObject>(res, file.toFullRaw());
		} else {
			json<FileObject>(res, file.toRaw());
		}
	}
);
