import * as express from 'express';

import getpost from './getpost';
import setpost from './setpost';
import addpost from './addpost';
import getlist from './getlist';

import { BlogPost } from '../../types';
export { BlogPost };

let posts: BlogPost[] = [];

const router = express.Router();

router.get('/:id', getpost(posts));
router.put('/set/:id', setpost(posts));
router.post('/add', addpost(posts));
router.get('/list/:id', getlist(posts));

export default router;