import * as express from 'express';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
import Validator from '../../lib/validator/Validator';
import AbsenteeValidator from '../../lib/validator/validators/AbsenteeValidator';
import FlightAssignBulkValidator from '../../lib/validator/validators/FlightAssignBulkValidator';
import FlightAssignValidator from '../../lib/validator/validators/FlightAssignValidator';
import { tokenMiddleware } from '../formtoken';
// API routes
import absent from './absent';
import capwatch from './capwatch';
import flightassign from './flights/flightassign';
import flightassignbulk from './flights/flightassignbulk';
import flightbasic from './flights/flightbasic';
import flightmembers from './flights/flightmembers';
import getmembers from './getmembers';
import getpermissions from './permissions/getpermissions';
import setpermissions, { permissionsValidator } from './permissions/setpermissions';
import su from './su';
import setdutypositions, { setDutyPositionsValidator } from './temporarydutypositions/set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', MemberBase.ExpressMiddleware, getmembers);
router.post('/su', MemberBase.ExpressMiddleware, su);
router.post(
	'/absent',
	MemberBase.ExpressMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(AbsenteeValidator),
	absent
);

router.get('/flight', MemberBase.ExpressMiddleware, flightmembers);
router.get('/flight/basic', MemberBase.ExpressMiddleware, flightbasic);
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

router.get(
	'/permissions',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('PermissionManagement'),
	getpermissions
);
router.post(
	'/permissions',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('PermissionManagement'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(permissionsValidator),
	setpermissions
);

router.get(
	'/tempdutypositions/:type/:id',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('AssignPosition'),
	tokenMiddleware
);
router.post(
	'/tempdutypositions/:type/:id',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('AssignPosition'),
	tokenMiddleware,
	Validator.BodyExpressMiddleware(setDutyPositionsValidator),
	setdutypositions
);

router.use(
	'/capwatch',
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('DownloadCAPWATCH'),
	capwatch
);

export default router;
