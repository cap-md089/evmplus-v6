import { Router } from 'express';
import Account from '../../../lib/Account';
import NHQMember from '../../../lib/members/NHQMember';
import { tokenMiddleware } from '../../formtoken';
// API calls
import add from './add';
import addchild from './addchild';
import deletePage from './deletePage';
import get from './get';
import list from './list';
import removechild from './removechild';
import set from './set';

const router = Router();

router.use(Account.ExpressMiddleware);

router.get('/', list);
router.post('/', NHQMember.ExpressMiddleware, tokenMiddleware, add);
router.delete('/:id', NHQMember.ExpressMiddleware, tokenMiddleware, deletePage);
router.put('/:id', NHQMember.ExpressMiddleware, tokenMiddleware, set);
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
