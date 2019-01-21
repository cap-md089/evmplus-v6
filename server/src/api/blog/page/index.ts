import { Router } from 'express';
import BlogPage from '../../../lib/BlogPage';
import NHQMember from '../../../lib/members/NHQMember';
import Validator from '../../../lib/validator/Validator';
import { tokenMiddleware } from '../../formtoken';
import add from './add';
import addchild from './addchild';
import deletePage from './deletePage';
import get from './get';
import list from './list';
import removechild from './removechild';
import set from './set';

const router = Router();

router.get('/', list);
router.post(
	'/',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	NHQMember.BlogPermissionMiddleware,
	Validator.BodyExpressMiddleware(BlogPage.Validator),
	add
);
router.delete(
	'/:id',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	NHQMember.BlogPermissionMiddleware,
	deletePage
);
router.put(
	'/:id',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	NHQMember.BlogPermissionMiddleware,
	Validator.PartialBodyExpressMiddleware(BlogPage.Validator),
	set
);
router.get('/:id', get);

router.delete(
	'/:id/children/:child',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	removechild
);
router.post(
	'/:id/children/:child',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	addchild
);

export default router;
