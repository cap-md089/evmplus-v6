import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration as config } from '../../../conf';

import { AccountRequest } from '../../../lib/Account';
import { prettySQL } from '../../../lib/MySQLUtil';

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

	const requestedFileQuery: Array<{
		id: string;
		memberOnly: number;
		contentType: string;
		fileName: string;
	}> = await req.connectionPool.query(
		prettySQL`
			SELECT
				id, memberOnly, contentType, fileName
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

	if (requestedFileQuery.length !== 1) {
		res.status(404);
		res.end();
		return;
	}

	const fileRequestedData = requestedFileQuery[0];
	const fileRequested = fs.createReadStream(join(config.fileStoragePath, fileRequestedData.id));

	res.contentType(fileRequestedData.contentType);
	res.header({
		'Content-Disposition': 'attachment; filename="' + fileRequestedData.fileName + '"'
	});

	fileRequested.on('data', data => {
		res.send(data);
	});
};
