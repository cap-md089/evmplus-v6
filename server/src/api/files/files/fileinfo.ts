import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/MemberBase';
import { collectResults } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';

export default async (
	req: AccountRequest & MemberRequest,
	res: express.Response
) => {
	if (
		typeof req.account === 'undefined' ||
		typeof req.params === 'undefined' ||
		typeof req.params.fileid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const filesCollection = req.mysqlx.getCollection<FileObject>('Files');

	const results = await collectResults(
		filesCollection.find(':accountID = :id AND id = :id').bind({
			accountID: req.account.id,
			id: req.params.fileid
		})
	);

	if (results.length !== 1) {
		res.send(404);
		return;
	}

	const file = results[0];

	if (file.memberOnly && typeof req.member === 'undefined') {
		res.send(400);
		return;
	}

	json<FileObject>(res, results[0]);
};
