import * as express from 'express';

import addpost from './addpost';
import deletePost from './deletePost';
import getlist from './getlist';
import getpost from './getpost';
import setpost from './setpost';

export { BlogPost } from '../../../types';

import * as mysql from 'promise-mysql';

import Member from '../../../lib/members/NHQMember';

export default (pool: mysql.Pool) => {
	const router = express.Router();

	router.get('/:id', getpost(pool));
	router.put('/set/:id', Member.ExpressMiddleware, setpost(pool));
	router.post('/add', addpost(pool));
	router.get('/list/:start', Member.ExpressMiddleware, getlist(pool));
	router.delete('/:id', Member.ExpressMiddleware, deletePost(pool));

	return router;
};