import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';

export default async (req: AccountRequest, res: express.Response, next: Function) => {
	if (
		typeof req.account === 'undefined' ||
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

	await req.connectionPool.query(
		prettySQL`
			INSERT INTO
				DriveChildrenList (
					childID,
					folderID,
					accountID
				)
			VALUES
				(
					?,
					?,
					?
				)
		`,
		[
			childid,
			parentid,
			req.account.id
		]
	);

	res.status(204);
};