import * as express from 'express';
import {
	AbsenteeValidator,
	Account,
	FlightAssignBulkValidator,
	FlightAssignValidator,
	leftyMemberMiddleware,
	leftyPermissionMiddleware,
	memberMiddleware,
	memberMiddlewareGenerator,
	Validator,
	asyncErrorHandler,
	SessionType
} from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
// API routes
import absent from './absent';
import account from './account';
import basic from './attendance/basic';
import short from './attendance/short';
import capwatch from './capwatch';
import flightassign from './flights/flightassign';
import flightassignbulk from './flights/flightassignbulk';
import flightbasic from './flights/flightbasic';
import flightmembers from './flights/flightmembers';
import getmembers from './getmembers';
import passwordreset from './passwordreset';
import setpermissions, { permissionsValidator } from './permissions/setpermissions';
import su from './su';
import getdutypositions from './temporarydutypositions/get';
import setdutypositions, { setDutyPositionsValidator } from './temporarydutypositions/set';

const router = express.Router();

router.use('/account', account);
router.use('/capwatch', capwatch);

router.use(Account.LeftyExpressMiddleware);

router.get('/', memberMiddleware, getmembers);
router.post('/su', leftyMemberMiddleware, leftyTokenMiddleware, su);
router.post(
	'/absent',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(AbsenteeValidator),
	absent
);

router.get('/flight', memberMiddleware, flightmembers);
router.get('/flight/basic', memberMiddleware, flightbasic);
router.post(
	'/flight',
	leftyMemberMiddleware,
	leftyPermissionMiddleware('FlightAssign'),
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(FlightAssignValidator),
	flightassign
);
router.post(
	'/flight/bulk',
	leftyMemberMiddleware,
	leftyPermissionMiddleware('FlightAssign'),
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(FlightAssignBulkValidator),
	flightassignbulk
);

router.post(
	'/permissions',
	leftyMemberMiddleware,
	leftyPermissionMiddleware('PermissionManagement'),
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(permissionsValidator),
	setpermissions
);

router.get(
	'/tempdutypositions/:type/:id',
	leftyMemberMiddleware,
	leftyPermissionMiddleware('AssignTemporaryDutyPositions'),
	leftyTokenMiddleware,
	getdutypositions
);
router.post(
	'/tempdutypositions/:type/:id',
	leftyMemberMiddleware,
	leftyPermissionMiddleware('AssignTemporaryDutyPositions'),
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(setDutyPositionsValidator),
	setdutypositions
);

router.get('/attendance', leftyMemberMiddleware, basic);
router.get('/attendance/short', leftyMemberMiddleware, short);
router.get(
	'/attendance/:reference',
	leftyMemberMiddleware,
	leftyPermissionMiddleware('AttendanceView'),
	basic
);

router.post(
	'/passwordreset',
	memberMiddlewareGenerator(
		asyncErrorHandler,
		// tslint:disable-next-line:no-bitwise
		SessionType.PASSWORD_RESET | SessionType.REGULAR,
		true
	),
	leftyTokenMiddleware,
	passwordreset
);

export default router;
