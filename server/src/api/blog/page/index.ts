import { Router } from 'express';
import Account from '../../../lib/Account';
import { NHQMember } from '../../../lib/MemberBase';
// API calls
import add from './add';
import deletePage from './deletePage';
import get from './get';
import list from './list';
import set from './set';

const router = Router();

router.use(Account.ExpressMiddleware);

router.get('/', list);
router.post('/', NHQMember.ExpressMiddleware, add);
router.delete('/:id', NHQMember.ExpressMiddleware, deletePage);
router.put('/:id', NHQMember.ExpressMiddleware, set);
router.get('/:id', NHQMember.ExpressMiddleware, get);

export default router;
