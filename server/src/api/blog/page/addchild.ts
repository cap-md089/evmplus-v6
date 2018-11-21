import { Response } from 'express';
import BlogPage from '../../../lib/BlogPage';
import { MemberRequest } from '../../../lib/MemberBase';

export default async (req: MemberRequest, res: Response) => {
	let page: BlogPage;

	if (typeof req.params.id !== 'string') {
		res.status(400);
		res.end();
		return;
	}

	try {
		page = await BlogPage.Get(req.params.id, req.account, req.mysqlx);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	page.set({
		children: [...page.children, req.params.id]
	});

	try {
		await page.save();
	} catch (e) {
		res.status(500);
		res.end();
		return;
	}

	res.status(204);
	res.end();
};
