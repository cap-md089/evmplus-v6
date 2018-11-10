import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: MemberRequest, res: express.Response) => {
	if (
		typeof req.params.parentid === 'undefined' ||
		typeof req.body === 'undefined' ||
		typeof req.body.id === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const parentid = req.params.parentid;
	const childid = req.body.id;

	let child, parent;

	try {
		[child, parent] = await Promise.all([
			File.Get(childid, req.account, req.mysqlx),
			File.Get(parentid, req.account, req.mysqlx)
		]);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	child.parentID = parentid;
	parent.fileChildren.push(childid);

	await Promise.all([child.save(), parent.save()]);

	res.status(204);
	res.end();
};
