import { Response } from 'express';
import { AccountRequest } from '../../../lib/Account';
import BlogPage from '../../../lib/BlogPage';

export default async (req: AccountRequest, res: Response) => {
	let page: BlogPage;

	try {
		page = await BlogPage.Get(req.params.id, req.account, req.mysqlx);
	} catch(e) {
		res.status(404);
		res.end();
		return;
	}

	page.set(req.body);

	try {
		await page.save();
	} catch(e) {
		res.status(500);
		res.end();
		return;
	}


	res.status(204);
	res.end();
}