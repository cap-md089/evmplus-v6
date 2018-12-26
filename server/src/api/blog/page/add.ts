import { Response } from 'express';
import { MemberValidatedRequest } from 'src/lib/validator/Validator';
import BlogPage from '../../../lib/BlogPage';
import { asyncErrorHandler, json } from '../../../lib/Util';

export default asyncErrorHandler(
	async (req: MemberValidatedRequest<NewBlogPage>, res: Response) => {
		const id = req.body.title
			.replace(/ +/g, ' ')
			.replace(' ', '-')
			.toLowerCase();

		let page: BlogPage;

		try {
			page = await BlogPage.Create(id, req.body, req.account, req.mysqlx);
		} catch (e) {
			if (e.message === 'ID already taken') {
				res.status(400);
				res.end();
				return;
			}

			throw e;
		}

		json<BlogPageObject>(res, page.toRaw());
	}
);
