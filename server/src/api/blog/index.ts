import * as express from 'express';
import Account from '../../lib/Account';
import page from './page';
import post from './post';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.use('/post', Account.PayWall, post);
router.use('/page', page);

export default router;
