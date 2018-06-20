import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';

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

	const parentid = req.params.parentid;
	const childid = req.params.childid;

	const fileInfo: Array<{
		childID: string
	}> = await req.connectionPool.query(
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
			childLink: req.account.buildURI('api', 'files', childid),
			id: childid,
			kind: 'drive#childReference',
			selfLink: req.account.buildURI('api', 'files', parentid, 'children', childid)
		});
	}
};