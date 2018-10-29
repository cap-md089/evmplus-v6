import * as express from 'express';
import Account from '../../lib/Account';
import NHQMember from '../../lib/members/NHQMember';
// CRUD functions
import get from './get';
import set from './set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', get);
router.post('/', NHQMember.ExpressMiddleware, set);

export default router;
