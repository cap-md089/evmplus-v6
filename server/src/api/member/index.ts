import * as express from 'express';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
// API routes
import flightmembers from './flightmembers';
import getmembers from './getmembers';
import su from './su';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', MemberBase.ExpressMiddleware, getmembers);
router.post('/su', MemberBase.ExpressMiddleware, su);
router.get('/flight', MemberBase.ExpressMiddleware, flightmembers);

export default router;
