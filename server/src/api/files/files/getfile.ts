import { FileUserAccessControlPermissions } from 'common-lib';
import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration as config } from '../../../conf';
import { asyncErrorHandler, ConditionalMemberRequest, File } from '../../../lib/internals';

export default asyncErrorHandler(
	async (req: ConditionalMemberRequest<{ fileid: string }>, res: express.Response) => {
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
			res.status(403);
			res.end();
			return;
		}

		const fileRequested = fs.createReadStream(
			join(config.fileStoragePath, file.accountID + '-' + file.id)
		);

		fileRequested
			.on('data', data => {
				res.write(data);
			})
			.on('end', () => {
				res.end();
			});
	}
);
