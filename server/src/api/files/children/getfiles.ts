import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';

export default async (req: AccountRequest, res: express.Response, next: Function) => {
	if (
		typeof req.account === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const parentid = typeof req.params.parentid === 'undefined' ? 'root' : req.params.parentid;

	const fileInfo: {
		childID: string
	}[] = await req.connectionPool.query(
		prettySQL`
			SELECT
				childID
			FROM
				DriveChildrenList
			WHERE
				accountID = ? AND folderID = ?
		`,
		[
			req.account.id,
			parentid
		]
	);

	res.json({
		kind: 'drive#childList',
		selfLink: req.account.buildURI('api', 'files', parentid, 'children'),
		items: [
			fileInfo.map(file => {
				return {
					kind: 'drive#childReference',
					id: file.childID,
					selfLink: req.account.buildURI('api', 'files', parentid, 'children', file.childID),
					childLink: req.account.buildURI('api', 'files', parentid)
				};
			})
		]
	});
};