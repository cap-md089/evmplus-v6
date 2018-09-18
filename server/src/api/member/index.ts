import * as express from 'express';
import { NHQMember } from '../../lib/MemberBase';
import getmembers from './getmembers';

const router = express.Router();

router.get('/', NHQMember.ExpressMiddleware, getmembers);

export default router;
