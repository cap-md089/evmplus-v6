import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';
import { FileObject } from '../../../types';

export default async (req: AccountRequest, res: express.Response) => {
	if (
		typeof req.account === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	const parentid = typeof req.params.parentid === 'undefined' ? 'root' : req.params.parentid;
	const method = typeof req.params.method === 'undefined' ? 'clean' : req.params.method;
	if ([
		'clean',
		'dirty'
	].indexOf(method) === -1) {
		res.status(400);
		res.end();
		return;
	}

	if (parentid !== 'root') {
		const fileCount: Array<{count: number}> = await req.connectionPool.query(
			prettySQL`
				SELECT
					COUNT(*) AS count
				FROM
					FileInfo
				WHERE
					accountID = ? AND id = ?
			`,
			[
				req.account.id,
				parentid
			]
		);

		if (fileCount[0].count !== 1) {
			res.status(404);
			res.end();
			return;
		}
	}

	const fileInfo: Array<{
		childID: string
	}> = await req.connectionPool.query(
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

	if (method === 'clean') {
		res.json({
			items: [
				fileInfo.map(file => ({
					childLink: req.account.buildURI('api', 'files', parentid),
					id: file.childID,
					kind: 'drive#childReference',
					selfLink: req.account.buildURI('api', 'files', parentid, 'children', file.childID),
				}))
			],
			kind: 'drive#childList',
			selfLink: req.account.buildURI('api', 'files', parentid, 'children'),
		});
	} else if (method === 'dirty') {
		const filesInfo: Array<{
			id: string,
			uploaderID: number,
			fileName: string,
			comments: string,
			contentType: string,
			created: number,
			memberOnly: number,
			forDisplay: number,
			forSlideshow: number,
			accountID: string
		}> = await req.connectionPool.query(
			`
				SELECT
					id, uploaderID, fileName, comments, contentType, created, memberOnly, forDisplay, forSlideshow, accountID
				FROM
					FileInfo
				WHERE
					accountID = ?
				AND
					id IN ('${
						fileInfo.map(value => value.childID).join('\', \'')
					}')
			`,
			[
				req.account.id
			]
		);
		json<FileObject[]>(res, filesInfo.map(dirtyFile => ({
			kind: 'drive#file' as 'drive#file',
			// tslint:disable-next-line:object-literal-sort-keys
			id: dirtyFile.id,
			uploaderID: dirtyFile.uploaderID,
			fileName: dirtyFile.fileName,
			comments: dirtyFile.comments,
			contentType: dirtyFile.contentType,
			created: dirtyFile.created,
			memberOnly: dirtyFile.memberOnly === 1,
			forDisplay: dirtyFile.forDisplay === 1,
			forSlideshow: dirtyFile.forSlideshow === 1,
			accountID: dirtyFile.accountID
		})));
	}
};