import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { collectResults, findAndBind } from '../../../lib/MySQLUtil';

export default async (req: AccountRequest, res: express.Response) => {
	if (
		typeof req.account === 'undefined' ||
		typeof req.params.parentid === 'undefined' ||
		typeof req.params.childid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	// The `{_id: string}` is from every document. It is how MySQL manages them
	const filesCollection = req.mysqlx.getCollection<
		FileObject & { _id: string }
	>('Files');

	const parentid = req.params.parentid;
	const childid = req.params.childid;

	const results = await collectResults(
		findAndBind(filesCollection, {
			accountID: req.account.id,
			id: parentid
		})
	);

	if (results.length !== 1) {
		res.send(400);
		return;
	}

	const fileChildren = results[0].fileChildren.filter(id => id !== childid);

	const newFile = {
		...results[0],
		fileChildren
	};

	filesCollection.addOrReplaceOne(newFile._id, newFile);

	res.status(204);
	res.end();
};
