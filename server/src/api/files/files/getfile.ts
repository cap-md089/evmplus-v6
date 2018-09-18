import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration as config } from '../../../conf';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: MemberRequest, res: express.Response) => {
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

	if (file.memberOnly && req.member === null) {
		res.status(403);
		res.end();
		return;
	}

	const fileRequested = fs.createReadStream(
		join(config.fileStoragePath, file.id)
	);

	res.contentType(file.contentType);
	res.header({
		'Content-Disposition': 'attachment; filename="' + file.fileName + '"'
	});

	fileRequested.on('data', data => {
		res.send(data);
	});
};
