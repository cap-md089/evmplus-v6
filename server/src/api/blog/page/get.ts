import { Response } from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPage from '../../../lib/BlogPage';
import { json } from '../../../lib/Util';

export default async (req: AccountRequest, res: Response) => {
	let page: BlogPage;

	try {
		page = await BlogPage.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	json<BlogPageObject>(res, page.toRaw());
}