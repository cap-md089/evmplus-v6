import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { collectResults, findAndBind } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';

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

	const filesCollection = req.mysqlx.getCollection<FileObject>('Files');

	if (parentid !== 'root') {
		const files = await collectResults(
			findAndBind(filesCollection, {
				accountID: req.account.id,
				id: parentid
			})
		);

		if (files.length === 1) {
			res.status(404);
			res.end();
			return;
		}
	}

	const fileList = await collectResults(
		findAndBind(filesCollection, {
			accountID: req.account.id,
			parentID: parentid
		})
	);

	json<FileObject[]>(res, fileList);
};
