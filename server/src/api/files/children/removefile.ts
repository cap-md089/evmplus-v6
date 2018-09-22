import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: MemberRequest, res: express.Response) => {
	if (
		typeof req.params.parentid === 'undefined' ||
		typeof req.params.childid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const parentid = req.params.parentid;
	const childid = req.params.childid;

	let file: File;

	try {
		file = await File.Get(parentid, req.account, req.mysqlx);
	} catch (e) {
		res.send(404);
		res.end();
		return;
	}

	const fileChildren = file.fileChildren.filter(id => id !== childid);

	file.set({
		fileChildren
	});

	try {
		await file.save();
	} catch (e) {
		res.send(500);
		res.end(0);
		return;
	}

	res.status(204);
	res.end();
};
