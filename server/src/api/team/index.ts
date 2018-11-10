import * as express from 'express';
import Account from '../../lib/Account';
import NHQMember from '../../lib/members/NHQMember';
// API routes
import create from './create';
import deleteTeam from './delete';
import get from './get';
import list from './list';
import members from './members';
import set from './set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', NHQMember.ConditionalExpressMiddleware, list);
router.get('/:id', NHQMember.ConditionalExpressMiddleware, get);
router.post('/', NHQMember.ExpressMiddleware, create);
router.put('/:id', NHQMember.ExpressMiddleware, set);
router.delete('/:id', NHQMember.ExpressMiddleware, deleteTeam);

router.use('/:id/members', NHQMember.ExpressMiddleware, members);

export default router;