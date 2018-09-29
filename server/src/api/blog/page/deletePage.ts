import { Response } from 'express';
import BlogPage from '../../../lib/BlogPage';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: MemberRequest, res: Response) => {
	let page: BlogPage;

	try {
		page = await BlogPage.Get(req.params.id, req.account, req.mysqlx);
	} catch(e) {
		res.status(404);
		res.end();
		return;
	}

	try {
		await page.delete();
	} catch(e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(204);
	res.end();
}