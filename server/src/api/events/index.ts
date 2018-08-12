import * as express from 'express';
import Account from '../../lib/Account';

// Event handlers
import addevent from './addevent';
import list from './list';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', list);
router.post('/', addevent);

export default router;
