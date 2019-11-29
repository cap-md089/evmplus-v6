import * as express from 'express';
import {
	AbsenteeValidator,
	Account,
	FlightAssignBulkValidator,
	FlightAssignValidator,
	memberMiddleware,
	memberMiddlewareWithPassswordOnly,
	permissionMiddleware,
	Validator
} from '../../lib/internals';
import { tokenMiddleware } from '../formtoken';
// API routes
import absent from './absent';
import account from './account';
import basic from './attendance/basic';
import forcadet from './attendance/forother';
import capwatch from './capwatch';
import flightassign from './flights/flightassign';
import flightassignbulk from './flights/flightassignbulk';
import flightbasic from './flights/flightbasic';
import flightmembers from './flights/flightmembers';
import getmembers from './getmembers';
import passwordreset from './passwordreset';
import getpermissions from './permissions/getpermissions';
import setpermissions, { permissionsValidator } from './permissions/setpermissions';
import su from './su';
import getdutypositions from './temporarydutypositions/get';
import setdutypositions, { setDutyPositionsValidator } from './temporarydutypositions/set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', memberMiddleware, getmembers);
router.post('/su', memberMiddleware, tokenMiddleware, su);
router.post(
	'/absent',
	memberMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(AbsenteeValidator),
	absent
);

router.get('/flight', memberMiddleware, flightmembers);
router.get('/flight/basic', memberMiddleware, flightbasic);
router.post(
	'/flight',
	memberMiddleware,
	permissionMiddleware('FlightAssign'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(FlightAssignValidator),
	flightassign
);
router.post(
	'/flight/bulk',
	memberMiddleware,
	permissionMiddleware('FlightAssign'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(FlightAssignBulkValidator),
	flightassignbulk
);

router.get(
	'/permissions',
	memberMiddleware,
	permissionMiddleware('PermissionManagement'),
	getpermissions
);
router.post(
	'/permissions',
	memberMiddleware,
	permissionMiddleware('PermissionManagement'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(permissionsValidator),
	setpermissions
);

router.get(
	'/tempdutypositions/:type/:id',
	memberMiddleware,
	permissionMiddleware('AssignTemporaryDutyPositions'),
	tokenMiddleware,
	getdutypositions
);
router.post(
	'/tempdutypositions/:type/:id',
	memberMiddleware,
	permissionMiddleware('AssignTemporaryDutyPositions'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(setDutyPositionsValidator),
	setdutypositions
);

router.use('/capwatch', memberMiddleware, permissionMiddleware('DownloadCAPWATCH'), capwatch);
router.use('/account', account);

router.post(
	'/generateattendance',
	memberMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(Validator.MemberReference),
	basic
);
router.post(
	'/generateattendance/other',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('PromotionManagement'),
	Validator.BodyExpressMiddleware(Validator.MemberReference),
	forcadet
);

router.post('/passwordreset', memberMiddlewareWithPassswordOnly, tokenMiddleware, passwordreset);

export default router;
