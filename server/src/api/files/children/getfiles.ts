import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import File from '../../../lib/File';

export default async (req: AccountRequest, res: express.Response) => {
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

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

	try {
		const folder = await File.Get(parentid, req.account, req.mysqlx);

		let started = false;

		res.status(200);
		res.set('Content-type', 'application/json');

		for await (const file of folder.getChildren()) {
			if (started) {
				res.write(',' + JSON.stringify(file.toRaw()));
			} else {
				res.write('[' + JSON.stringify(file.toRaw()));
				started = true;
			}
		}

		res.write(']');
		res.end();
	} catch (e) {
		// tslint:disable-next-line
		console.log(e);
		res.status(500);
		res.end();
	}
};