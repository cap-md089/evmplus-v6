import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration as config } from '../conf';

import { AccountRequest } from '../lib/Account';
import { prettySQL } from '../lib/MySQLUtil';

export default async (req: AccountRequest, res: express.Response, next: express.NextFunction) => {
	if (typeof req.account === 'undefined') {
		res.status(400);
		res.end();
		return;
	}

	const imageRequest: Array<{id: string}> = await req.connectionPool.query(
		prettySQL`
			SELECT
				id
			FROM
				FileInfo
			WHERE
				accountID = ? AND forSlideshow = 1
			ORDER BY
				RAND()
			LIMIT
				0,1
		`,
		[req.account.id]
	);

	if (imageRequest.length === 0) {
		res.status(404);
		res.end();
		return;
	}

	const randImageId = imageRequest[0].id;
	const randImage = fs.createReadStream(join(config.fileStoragePath, randImageId));
	
	randImage.on('data', res.send);
};
