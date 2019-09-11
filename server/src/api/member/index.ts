import * as express from 'express';
import Account from '../../lib/Account';
import { memberMiddleware, permissionMiddleware } from '../../lib/member/pam/Session';
import Validator from '../../lib/validator/Validator';
import AbsenteeValidator from '../../lib/validator/validators/AbsenteeValidator';
import FlightAssignBulkValidator from '../../lib/validator/validators/FlightAssignBulkValidator';
import FlightAssignValidator from '../../lib/validator/validators/FlightAssignValidator';
import { tokenMiddleware } from '../formtoken';
// API routes
import absent from './absent';
import account from './account';
import capwatch from './capwatch';
import flightassign from './flights/flightassign';
import flightassignbulk from './flights/flightassignbulk';
import flightbasic from './flights/flightbasic';
import flightmembers from './flights/flightmembers';
import getmembers from './getmembers';
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
	permissionMiddleware('AssignPosition'),
	tokenMiddleware,
	getdutypositions
);
router.post(
	'/tempdutypositions/:type/:id',
	memberMiddleware,
	permissionMiddleware('AssignPosition'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(setDutyPositionsValidator),
	setdutypositions
);

router.use('/capwatch', memberMiddleware, permissionMiddleware('DownloadCAPWATCH'), capwatch);
router.use('/account', account)

export default router;
