import * as express from 'express';
import Account from '../../lib/Account';
import Event from '../../lib/Event';
import {
	conditionalMemberMiddleware,
	memberMiddleware,
	permissionMiddleware
} from '../../lib/member/pam/Session';
import { replaceUndefinedWithNullMiddleware } from '../../lib/Util';
import Validator from '../../lib/validator/Validator';
import { tokenMiddleware } from '../formtoken';
// Attendance
import addattendance from './attendance/addattendance';
import addattendancebulk, { attendanceBulkValidator } from './attendance/addattendancebulk';
import deleteattendance from './attendance/deleteattendance';
import getattendance from './attendance/getattendance';
import modifyattendance from './attendance/modifyattendance';
// Debrief
import adddebrief from './debrief/adddebrief';
import deletedebrief from './debrief/deletedebrief';
// Event handlers
import addevent from './events/addevent';
import copy from './events/copy';
import deleteevent from './events/deleteevent';
import getevent from './events/getevent';
import getnextrecurring from './events/getnextrecurring';
import linkevent from './events/linkevent';
import list from './events/list';
import listupcoming from './events/listupcoming';
import setevent from './events/setevent';
import timelist from './events/timelist';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', conditionalMemberMiddleware, list);
router.get('/upcoming', listupcoming);
router.get('/recurring', getnextrecurring);
router.get('/:start/:end', conditionalMemberMiddleware, timelist);
router.post(
	'/',
	memberMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(Event.Validator),
	permissionMiddleware('ManageEvent'),
	addevent
);
router.post('/:parent', memberMiddleware, tokenMiddleware, linkevent);
router.delete('/:id', memberMiddleware, tokenMiddleware, deleteevent);
router.put(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	Validator.PartialBodyExpressMiddleware(Event.Validator),
	setevent
);
router.get('/:id', memberMiddleware, getevent);
router.post('/:id/copy', memberMiddleware, tokenMiddleware, copy);

router.get('/:id/attendance', memberMiddleware, getattendance);
router.post(
	'/:id/attendance/bulk',
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(attendanceBulkValidator),
	addattendancebulk
);
router.post(
	'/:id/attendance',
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(Event.AttendanceValidator),
	addattendance
);
router.put(
	'/:id/attendance',
	memberMiddleware,
	replaceUndefinedWithNullMiddleware,
	tokenMiddleware,
	Validator.BodyExpressMiddleware(Event.AttendanceValidator),
	modifyattendance
);
router.delete('/:id/attendance', memberMiddleware, tokenMiddleware, deleteattendance);

router.post('/:id/debrief', memberMiddleware, tokenMiddleware, adddebrief);
router.delete('/:id/debrief/:timestamp', memberMiddleware, tokenMiddleware, deletedebrief);

export default router;
