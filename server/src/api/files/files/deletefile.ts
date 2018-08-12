import * as express from 'express';
import * as fs from 'fs';
import { join } from 'path';
import { Configuration } from '../../../conf';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';
import { collectResults } from '../../../lib/MySQLUtil';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		typeof req.account !== 'undefined'
	) {
		const filesCollection = req.mysqlx.getCollection<FileObject>('Files');

		const currentFiles = await collectResults(
			filesCollection
				.find('accountID = :accountID AND id = :id')
				.bind({
					accountID: req.account.id,
					id: req.params.id
				})
		);

		if (currentFiles.length !== 1) {
			res.send(400);
			return;
		}

		await filesCollection
			.remove('accountID = :accountID AND id = :id')
			.bind({
				accountID: req.account.id,
				id: req.params.id
			})
			.execute();

		if (currentFiles[0].contentType !== 'application/folder') {
			// These files don't get an associated hard disk file
			fs.unlink(join(Configuration.fileStoragePath, req.params.id), err => {
				if (err) {
					res.status(500);
					res.end();
				} else {
					res.status(204);
					res.end();
				}
			});
		}
	} else {
		res.status(400);
		res.end();
	}
};
