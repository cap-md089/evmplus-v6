import * as express from 'express';

import post from './post';

export { BlogPost } from '../../types';

import * as mysql from 'promise-mysql';

export default (pool: mysql.Pool) => {
	const router = express.Router();

	router.use('/post', post(pool));

	return router;
};