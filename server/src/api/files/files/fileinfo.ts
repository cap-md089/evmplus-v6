import * as express from 'express';

import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';
import { FileObject } from '../../../types';

export default async (req: AccountRequest, res: express.Response, next: express.NextFunction) => {
	if (
		typeof req.account === 'undefined' ||
		typeof req.params === 'undefined' ||
		typeof req.params.fileid === 'undefined'
	) {
		res.status(400);
		res.end();
		return;
	}

	// Get file info
	const requestedFileQuery: {
		uploaderID: number;
		comments: string;
		created: number;
		forDisplay: number;
		forSlideshow: number;
		memberOnly: number;
		contentType: string;
		fileName: string;
	}[] = await req.connectionPool.query(
		prettySQL`
			SELECT
				uploaderID,
				comments,
				created,
				forDisplay,
				forSlideshow,
				memberOnly,
				contentType,
				fileName
			FROM
				FileInfo
			WHERE
				accountID = ? AND id = ?
		`,
		[
			req.account.id,
			req.params.fileid
		]
	);

	// Check for valid amount
	if (requestedFileQuery.length !== 1) {
		res.status(404);
		res.end();
		return;
	}

	// Return file info
	const fileRequestedData = {
		kind: 'drive#file' as 'drive#file',
		id: req.params.fileid,
		accountID: req.account.id,
		...requestedFileQuery[0],
		memberOnly: requestedFileQuery[0].memberOnly === 1,
		forDisplay: requestedFileQuery[0].forDisplay === 1,
		forSlideshow: requestedFileQuery[0].forSlideshow === 1
	};
	json<FileObject>(res, fileRequestedData);
};
