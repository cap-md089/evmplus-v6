import * as express from 'express';
import { BlogPost } from './index';

export default (posts: BlogPost[]) => {
	return (req: express.Request, res: express.Response, next: Function) => {
		let maxId = 0;
		posts.forEach(post => {
			maxId = Math.max(maxId, post.id);
		});
		maxId++;

		if (typeof req.body !== 'undefined' && typeof req.body.content !== 'undefined') {
			let post: BlogPost = {
				id: maxId,
				content: req.body.content,
				fileIDs: [],
				title: req.body.title
			};
			posts.push(post);
			res.json(post);
			res.status(200);
			res.end();
		} else {
			res.status(400);
			res.end();
		}
	};
};