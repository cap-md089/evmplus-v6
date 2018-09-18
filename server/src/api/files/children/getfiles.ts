import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';
import { streamAsyncGeneratorAsJSONArray } from '../../../lib/Util';

export default async (req: MemberRequest, res: express.Response) => {
	const parentid =
		typeof req.params.parentid === 'undefined'
			? 'root'
			: req.params.parentid;
	const method =
		typeof req.params.method === 'undefined' ? 'clean' : req.params.method;
	if (['clean', 'dirty'].indexOf(method) === -1) {
		res.status(400);
		res.end();
		return;
	}

	let folder;

	try {
		folder = await File.Get(parentid, req.account, req.mysqlx);

	} catch (e) {
		// tslint:disable-next-line
		console.log(e);
		res.status(404);
		res.end();
	}

	streamAsyncGeneratorAsJSONArray<FileObject>(
		res,
		folder.getChildren(),
		JSON.stringify
	);
};
