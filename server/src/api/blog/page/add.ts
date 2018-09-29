import { Response } from 'express';
import BlogPage from '../../../lib/BlogPage';
import { MemberRequest } from '../../../lib/MemberBase';
import { getFullSchemaValidator, json } from '../../../lib/Util';

const validator = getFullSchemaValidator<NewBlogPage>('NewBlogPage.json');

export default async (req: MemberRequest, res: Response) => {
	if (!validator(req.body.page) && typeof req.body.id !== 'number') {
		res.status(400);
		res.end();
		return;
	}

	let page: BlogPage;

	try {
		page = await BlogPage.Create(
			req.body.id,
			req.body.page,
			req.account,
			req.mysqlx
		);
	} catch (e) {
		res.status(e.message === 'ID already taken' ? 400 : 500);
		res.end();
		return;
	}

	json<BlogPageObject>(res, page.toRaw());
};
