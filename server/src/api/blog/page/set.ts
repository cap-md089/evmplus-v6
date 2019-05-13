import { NewBlogPage } from 'common-lib';
import { Response } from 'express';
import BlogPage from '../../../lib/BlogPage';
import { asyncErrorHandler } from '../../../lib/Util';
import { BasicValidatedRequest } from '../../../lib/validator/Validator';

export default asyncErrorHandler(
	async (req: BasicValidatedRequest<NewBlogPage, { id: string }>, res: Response) => {
		let page: BlogPage;

		try {
			page = await BlogPage.Get(req.params.id, req.account, req.mysqlx);
		} catch (e) {
			res.status(404);
			res.end();
			return;
		}

		page.set(req.body);

		await page.save();

		res.status(204);
		res.end();
	}
);
