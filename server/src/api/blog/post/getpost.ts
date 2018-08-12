import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { collectResults } from '../../../lib/MySQLUtil';
import { json } from '../../../lib/Util';

export default async (req: AccountRequest, res: express.Response) => {
	if (
		typeof req.params.id !== 'undefined' &&
		typeof req.account !== 'undefined'
	) {
		const blogPosts = req.mysqlx.getCollection<BlogPost>('Blog');

		const results = await collectResults(
			blogPosts
				.find('accountID = :accountID AND id = :id')
				.bind({
					accountID: req.account.id,
					id: req.params.id
				})
		);

		if (results.length !== 1) {
			res.send(400);
			return;
		}

		json<BlogPost>(res, results[0]);
	} else {
		res.status(400);
		res.end();
	}
};