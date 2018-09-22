import * as express from 'express';
import File from '../../../lib/File';
import { ConditionalMemberRequest } from '../../../lib/MemberBase';
import { json } from '../../../lib/Util';

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

	if (file.memberOnly && req.member === null) {
		res.send(403);
		res.end();
		return;
	}

	json<FileObject>(res, file.toRaw());
};
