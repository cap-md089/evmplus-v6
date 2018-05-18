import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';

export default async (req: AccountRequest, res: express.Response, next: Function) => {
	if (
		typeof req.account === 'undefined' ||
		typeof req.params.parentid === 'undefined' ||
		typeof req.params.childid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const parentid = req.params.parentid;
	const childid = req.params.childid;

	await req.connectionPool.query(
		prettySQL`
			DELETE FROM
				DriveChildrenList
			WHERE
				accountID = ? AND folderID = ? AND childID = ?
		`,
		[
			req.account.id,
			parentid,
			childid
		]
	);

	res.status(204);
	res.end();
};