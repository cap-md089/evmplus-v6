import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration as config } from '../../../conf';

import { AccountRequest } from '../../../lib/Account';
import { collectResults } from '../../../lib/MySQLUtil';

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

	const filesCollection = req.mysqlx.getCollection<FileObject>('Files');

	const results = await collectResults(
		filesCollection
			.find('id = :id AND accountID = :accountID')
			.bind({
				id: req.params.fileid,
				accountID: req.account.id
			})
	);

	if (results.length !== 1) {
		res.status(404);
		res.end();
		return;
	}

	const fileRequestedData = results[0];
	const fileRequested = fs.createReadStream(join(config.fileStoragePath, fileRequestedData.id));

	res.contentType(fileRequestedData.contentType);
	res.header({
		'Content-Disposition': 'attachment; filename="' + fileRequestedData.fileName + '"'
	});

	fileRequested.on('data', data => {
		res.send(data);
	});
};
