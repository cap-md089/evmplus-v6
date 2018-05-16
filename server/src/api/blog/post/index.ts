import * as express from 'express';

import getpost from './getpost';
import setpost from './setpost';
import addpost from './addpost';
import getlist from './getlist';
import deletePost from './deletePost';

export { BlogPost } from '../../../types';

import * as mysql from 'promise-mysql';

import Member from '../../../lib/Member';

export default (pool: mysql.Pool) => {
	const router = express.Router();

	router.get('/:id', getpost(pool));
	router.put('/set/:id', Member.ExpressMiddleware, setpost(pool));
	router.post('/add', addpost(pool));
	router.get('/list/:start', Member.ExpressMiddleware, getlist(pool));
	router.delete('/:id', Member.ExpressMiddleware, deletePost(pool));

	return router;
};