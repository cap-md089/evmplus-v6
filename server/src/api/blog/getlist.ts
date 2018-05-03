import * as express from 'express';
import { BlogPost } from './index';

export default (posts: BlogPost[]) => {
	return (req: express.Request, res: express.Response, next: Function) => {
		if (typeof req.params.id !== 'undefined') {
			const start = parseInt(req.params.id, 10) * 10;

			let postCollection = posts.slice(start, start + 10);
			if (postCollection.length === 0 && start !== 0) {
				res.status(400);
				res.end();
				return;
			}

			res.json({
				posts: postCollection,
				displayLeft: start !== 0,
				displayRight: start + 10 < posts.length
			});
		} else {
			res.status(400);
			res.end();
		}
	};
};