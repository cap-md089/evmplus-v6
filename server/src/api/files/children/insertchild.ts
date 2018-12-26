import * as express from 'express';
import File from '../../../lib/File';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberRequest, res: express.Response) => {
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

		let child, parent, oldparent;

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

		try {
			oldparent = await child.getParent();
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		oldparent.removeChild(child);

		await parent.addChild(child);

		await Promise.all([oldparent.save(), child.save(), parent.save()]);

		res.status(204);
		res.end();
	}
);
