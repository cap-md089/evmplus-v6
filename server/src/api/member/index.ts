import * as express from 'express';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
import Validator from '../../lib/validator/Validator';
import AbsenteeValidator from '../../lib/validator/validators/AbsenteeValidator';
import { tokenMiddleware } from '../formtoken';
// API routes
import absent from './absent';
import flightmembers from './flightmembers';
import getmembers from './getmembers';
import su from './su';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', MemberBase.ExpressMiddleware, getmembers);
router.post('/su', MemberBase.ExpressMiddleware, su);
router.get('/flight', MemberBase.ExpressMiddleware, flightmembers);
router.post(
	'/absent',
	MemberBase.ExpressMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(AbsenteeValidator),
	absent
);

export default router;
