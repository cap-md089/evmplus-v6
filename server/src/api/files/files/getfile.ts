import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { FileUserAccessControlPermissions } from '../../../../../lib/index';
import { Configuration as config } from '../../../conf';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';

export default async (req: ConditionalMemberRequest, res: express.Response) => {
	if (
		typeof req.params === 'undefined' ||
		typeof req.params.fileid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

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

	res.contentType(file.contentType);
	res.setHeader(
		'Content-Disposition',
		'attachment; filename="' + file.fileName + '"'
	);

	fileRequested
		.on('data', data => {
			res.write(data);
		})
		.on('end', () => {
			res.end();
		});
};
