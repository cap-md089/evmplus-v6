import { Response } from 'express';
import BlogPage from '../../../lib/BlogPage';
import { MemberRequest } from '../../../lib/MemberBase';
import { asyncErrorHandler } from '../../../lib/Util';

export default asyncErrorHandler(async (req: MemberRequest, res: Response) => {
	let parentPage: BlogPage;
	let childPage: BlogPage;

	if (
		typeof req.params.id !== 'string' ||
		typeof req.params.child !== 'string'
	) {
		res.status(400);
		res.end();
		return;
	}

	try {
		[parentPage, childPage] = await Promise.all([
			BlogPage.Get(req.params.id, req.account, req.mysqlx),
			BlogPage.Get(req.params.child, req.account, req.mysqlx)
		]);
	} catch (e) {
		res.status(404);
		res.end();
		return;
	}

	try {
		await parentPage.addChild(childPage);
	} catch(e) {
		res.status(400);
		res.end();
		return;
	}

	await Promise.all([
		parentPage.save(),
		childPage.save()
	]);

	res.status(204);
	res.end();
});
