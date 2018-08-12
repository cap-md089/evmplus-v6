import * as express from 'express';
import { BlogPostValidator } from '.';
import { AccountRequest } from '../../../lib/Account';
import { MemberRequest } from '../../../lib/BaseMember';

export default (blogPostValidator: BlogPostValidator) => {
	return async (req: AccountRequest & MemberRequest, res: express.Response) => {
		if (
			req.is('json') &&
			typeof req.account !== 'undefined' &&
			// typeof req.member !== 'undefined' &&
			blogPostValidator(req.body)
		) {
			const blogPostCollection = req.mysqlx.getCollection('Blog');

			await blogPostCollection
				.modify('id = :id AND accountID = :accountID')
				.bind({
					id: req.params.id,
					accountID: req.account.id
				})
				.patch(req.body)
				.execute();

			res.send(204);
		} else {
			res.status(400);
			res.end();
		}
	}
};