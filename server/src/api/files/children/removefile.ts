import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberRequest<{ parentid: string; childid: string }>, res: express.Response) => {
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

		let parent: File;
		let child: File;

		try {
			[parent, child] = await Promise.all([
				File.Get(parentid, req.account, req.mysqlx),
				File.Get(childid, req.account, req.mysqlx)
			]);
		} catch (e) {
			res.send(404);
			res.end();
			return;
		}

		parent.removeChild(child);

		await Promise.all([parent.save(), child.save()]);

		res.status(204);
		res.end();
	}
);
