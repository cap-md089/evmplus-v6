import * as express from 'express';
import { FileUserAccessControlPermissions } from '../../../../../lib/index';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler, json } from '../../../lib/Util';
import { FullFileObject, FileObject } from 'common-lib';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest, res: express.Response) => {
		let file: File;

		try {
			file = await File.Get(req.params.fileid, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		if (
			!file.hasPermission(
				req.member,
				FileUserAccessControlPermissions.READ
			)
		) {
			res.send(403);
			res.end();
			return;
		}

		if (
			req.params.method &&
			req.params.method === 'dirty'
		) {
			json<FullFileObject>(res, file.toFullRaw());
		} else {
			json<FileObject>(res, file.toRaw());
		}
	}
);
