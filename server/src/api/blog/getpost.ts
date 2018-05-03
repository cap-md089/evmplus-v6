import * as express from 'express';
import { BlogPost } from './index';

export default (posts: BlogPost[]) => {
	return (req: express.Request, res: express.Response, next: Function) => {
		if (typeof req.params.id !== 'undefined') {
			let post = posts.filter(blogpost =>
				blogpost.id === parseInt(req.params.id, 10)
			);
			if (post.length === 1) {
				res.json(post[0]);
			} else {
				res.status(404);
				res.end();
			}
		} else {
			res.status(400);
			res.end();
		}
	};
};