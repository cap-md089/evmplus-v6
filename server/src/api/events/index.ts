import * as express from 'express';
import Account from '../../lib/Account';
import NHQMember from '../../lib/members/NHQMember';

// Event handlers
import addevent from './addevent';
import list from './list';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', list);
router.post('/', NHQMember.ExpressMiddleware, addevent);

export default router;
