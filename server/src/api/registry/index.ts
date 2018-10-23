import * as express from 'express';
import NHQMember from '../../lib/members/NHQMember';
// CRUD functions
import get from './get';
import set from './set';

const router = express.Router();

router.get('/', get);
router.post('/', NHQMember.ExpressMiddleware, set);

export default router;
