import { Response } from 'express';
import BlogPost from '../../../lib/BlogPost';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest<{ id: string }>, res: Response) => {
	try {
		const blogPost = await BlogPost.Get(req.params.id, req.account, req.mysqlx);

		await blogPost.delete();

		res.status(204);
		res.end();
	} catch (e) {
		if (e.message === 'Could not get blog post') {
			res.status(404);
			res.end();
		} else {
			// tslint:disable-next-line:no-console
			console.log(e);
			res.status(500);
			res.end();
		}
	}
});
