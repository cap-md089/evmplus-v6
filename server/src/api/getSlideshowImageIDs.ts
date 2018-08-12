import * as express from 'express';
import { AccountRequest } from '../lib/Account';
import { collectResults, findAndBind } from '../lib/MySQLUtil';
import { json } from '../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	const filesCollection = req.mysqlx.getCollection<FileObject>('Files');

	const files = await collectResults(
		findAndBind(filesCollection, {
			accountID: req.account.id,
			forSlideshow: true
		})
	);

	if (files.length === 0) {
		res.status(404);
		res.end();
		return;
	}

	json<string[]>(res, files.map(file => file.id));
};
