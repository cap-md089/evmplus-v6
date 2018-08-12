import * as express from 'express';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';

export default async (req: AccountRequest & MemberRequest, res: express.Response) => {
	if (
		req.is('json') &&
		typeof req.account !== 'undefined' &&
		typeof req.member !== 'undefined'
	) {
		const blogPosts = await req.mysqlx.getCollection<BlogPost>('Blog');

		await blogPosts
			.remove('accountID = :accountID AND id = :id')
			.bind({
				accountID: req.account.id,
				id: req.params.id
			})
			.execute();

		res.status(204);
		res.end();
	} else {
		res.status(400);
		res.end();
	}
};
