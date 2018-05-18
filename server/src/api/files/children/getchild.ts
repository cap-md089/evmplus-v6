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

	const fileInfo: {
		childID: string
	}[] = await req.connectionPool.query(
		prettySQL`
			SELECT
				childID
			FROM
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

	if (fileInfo.length !== 1) {
		res.status(404);
		res.end();
	} else {
		res.json({
			kind: 'drive#childReference',
			id: childid,
			selfLink: req.account.buildURI('api', 'files', parentid, 'children', childid),
			childLink: req.account.buildURI('api', 'files', childid)
		});
	}
};