import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';
import { FileObject } from '../../../types';
import { json } from '../../../lib/Util';

export default async (req: AccountRequest, res: express.Response, next: Function) => {
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
		const fileCount: {count: number}[] = await req.connectionPool.query(
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

	if (method === 'clean') {
		res.json({
			kind: 'drive#childList',
			selfLink: req.account.buildURI('api', 'files', parentid, 'children'),
			items: [
				fileInfo.map(file => ({
					kind: 'drive#childReference',
					id: file.childID,
					selfLink: req.account.buildURI('api', 'files', parentid, 'children', file.childID),
					childLink: req.account.buildURI('api', 'files', parentid)
				}))
			]
		});
	} else if (method === 'dirty') {
		const filesInfo: {
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
		}[] = await req.connectionPool.query(
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