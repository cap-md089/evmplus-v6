import * as express from 'express';
import Account from '../../lib/Account';
import { NHQMember } from '../../lib/MemberBase';
// API routes
import getmembers from './getmembers';
import su from './su';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', NHQMember.ExpressMiddleware, getmembers);
router.post('/su', NHQMember.ExpressMiddleware, su);

export default router;
