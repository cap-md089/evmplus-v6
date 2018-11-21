import * as express from 'express';
import Member from '../../../lib/members/NHQMember';
import { tokenMiddleware } from '../../formtoken';
/**
 * Post functions
 */
import addpost from './addpost';
import deletePost from './deletePost';
import getlist from './getlist';
import getpost from './getpost';
import setpost from './setpost';

const router = express.Router();

router.get('/:id', getpost);
router.put('/:id', Member.ExpressMiddleware, tokenMiddleware, setpost);
router.post('/', Member.ExpressMiddleware, tokenMiddleware, addpost);
router.get('/', getlist);
router.delete('/:id', Member.ExpressMiddleware, tokenMiddleware, deletePost);

export default router;
