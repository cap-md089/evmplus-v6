import * as express from 'express';
import { join } from 'path';
import conf from '../../../conf';
import Member from '../../../lib/members/NHQMember';
import { getSchemaValidator } from '../../../lib/Util';
/**
 * Post functions
 */
import addpost from './addpost';
import deletePost from './deletePost';
import getlist from './getlist';
import getpost from './getpost';
import setpost from './setpost';

// tslint:disable-next-line:no-var-requires
const blogPostSchema = require(join(conf.schemaPath, 'BlogPost.json'));

const privateBlogPostValidator = getSchemaValidator(blogPostSchema);

const blogPostValidator = (val: any): val is BlogPost =>
	privateBlogPostValidator(val) as boolean;

export type BlogPostValidator = typeof blogPostValidator;

const router = express.Router();

router.get('/:id', getpost);
router.put('/:id', Member.ExpressMiddleware, setpost(blogPostValidator));
router.post('/', Member.ExpressMiddleware, addpost);
router.get('/list/:start', getlist);
router.delete('/:id', Member.ExpressMiddleware, deletePost);

export default router;