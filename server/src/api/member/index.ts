import * as express from 'express';
import FlightAssignBulkValidator from 'src/lib/validator/validators/FlightAssignBulkValidator';
import FlightAssignValidator from 'src/lib/validator/validators/FlightAssignValidator';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
import Validator from '../../lib/validator/Validator';
import AbsenteeValidator from '../../lib/validator/validators/AbsenteeValidator';
import { tokenMiddleware } from '../formtoken';
// API routes
import absent from './absent';
import flightassign from './flightassign';
import flightassignbulk from './flightassignbulk';
import flightbasic from './flightbasic';
import flightmembers from './flightmembers';
import getmembers from './getmembers';
import su from './su';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', MemberBase.ExpressMiddleware, getmembers);
router.post('/su', MemberBase.ExpressMiddleware, su);
router.get('/flight', MemberBase.ExpressMiddleware, flightmembers);
router.get('/flight/basic', MemberBase.ExpressMiddleware, flightbasic);
router.post(
	'/absent',
	MemberBase.ExpressMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(AbsenteeValidator),
	absent
);
router.post(
	'/flight',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('FlightAssign'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(FlightAssignValidator),
	flightassign
);
router.post(
	'/flight/bulk',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('FlightAssign'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(FlightAssignBulkValidator),
	flightassignbulk
);

export default router;