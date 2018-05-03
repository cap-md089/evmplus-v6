import * as express from 'express';
import { BlogPost } from './index';

export default (posts: BlogPost[]) => {
	return (req: express.Request, res: express.Response, next: Function) => {
		if (typeof req.params.id !== 'undefined') {
			let post = posts.filter(blogpost =>
				blogpost.id = req.params.id
			);
			if (post.length === 1) {
				if (typeof req.body !== 'undefined' && typeof req.body.content !== 'undefined') {
					post[0].content = req.body.content;
					res.status(200);
					res.end();
				} else {
					res.status(400);
					res.end();
				}
			} else {
				res.status(404);
				res.end();
			}
		}
	};
};