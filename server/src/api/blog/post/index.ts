import * as express from 'express';
/**
 * Blog post validator
 */
import Account from '../../../lib/Account';
import BlogPost from '../../../lib/BlogPost';
import Member from '../../../lib/members/NHQMember';
import Validator from '../../../lib/validator/Validator';
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

router.use(Account.ExpressMiddleware);

router.get('/:id', getpost);
router.put(
	'/:id',
	Member.ExpressMiddleware,
	tokenMiddleware,
	Member.BlogPermissionMiddleware,
	Validator.PartialBodyExpressMiddleware(BlogPost.Validator),
	setpost
);
router.post(
	'/',
	Member.ExpressMiddleware,
	tokenMiddleware,
	Member.BlogPermissionMiddleware,
	Validator.BodyExpressMiddleware(BlogPost.Validator),
	addpost
);
router.get('/', getlist);
router.delete(
	'/:id',
	Member.ExpressMiddleware,
	tokenMiddleware,
	Member.BlogPermissionMiddleware,
	deletePost
);

export default router;
