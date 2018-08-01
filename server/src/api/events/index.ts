import * as express from 'express';
import Account from '../../lib/Account';
import list from './list';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/list', list);

export default router;