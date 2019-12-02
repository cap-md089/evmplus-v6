import * as express from 'express';
import {
	Account,
	conditionalMemberMiddleware,
	EventValidator,
	leftyConditionalMemberMiddleware,
	leftyMemberMiddleware,
	leftyPermissionMiddleware,
	NewAttendanceRecordValidator,
	NewDebriefItemValidator,
	replaceUndefinedWithNullMiddleware,
	Validator
} from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
// Attendance
import addattendance from './attendance/addattendance';
import addattendancebulk, { attendanceBulkValidator } from './attendance/addattendancebulk';
import attendancelogcadet from './attendance/attendancelogcadet';
// import attendancelogsenior from './attendance/attendancelogsenior';
// import attendanceroster from './attendance/attendanceroster';
import deleteattendance from './attendance/deleteattendance';
import getattendance from './attendance/getattendance';
import modifyattendance from './attendance/modifyattendance';
// Debrief
import adddebrief from './debrief/adddebrief';
import deletedebrief from './debrief/deletedebrief';
// Event handlers
import addevent from './events/addevent';
import copy, { copyValidator } from './events/copy';
import deleteevent from './events/deleteevent';
import eventviewer from './events/eventviewer';
import getevent from './events/getevent';
import getnextrecurring from './events/getnextrecurring';
import linkevent from './events/linkevent';
import list from './events/list';
import listupcoming from './events/listupcoming';
import setevent from './events/setevent';
import timelist from './events/timelist';

const router = express.Router();

router.use(Account.LeftyExpressMiddleware);

router.get('/:id/attendance/log/cadet', leftyConditionalMemberMiddleware, attendancelogcadet);
// router.get('/:id/attendance/log/senior', conditionalMemberMiddleware, attendancelogsenior);
// router.get('/:id/attendance/roster', conditionalMemberMiddleware, attendanceroster);
router.get('/:id/attendance', leftyMemberMiddleware, getattendance);
router.post(
	'/:id/attendance/bulk',
	leftyMemberMiddleware,
	replaceUndefinedWithNullMiddleware,
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(attendanceBulkValidator),
	addattendancebulk
);
router.post(
	'/:id/attendance',
	leftyMemberMiddleware,
	replaceUndefinedWithNullMiddleware,
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(NewAttendanceRecordValidator),
	addattendance
);
router.put(
	'/:id/attendance',
	leftyMemberMiddleware,
	replaceUndefinedWithNullMiddleware,
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(NewAttendanceRecordValidator),
	modifyattendance
);
router.delete('/:id/attendance', leftyMemberMiddleware, leftyTokenMiddleware, deleteattendance);

router.post(
	'/:id/debrief',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	NewDebriefItemValidator.leftyExpressHandler,
	adddebrief
);
router.delete(
	'/:id/debrief/:timestamp',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	deletedebrief
);

router.get('/', leftyConditionalMemberMiddleware, list);
router.get('/upcoming', listupcoming);
router.get('/recurring', getnextrecurring);
router.get('/:start/:end', conditionalMemberMiddleware, timelist);
router.post(
	'/',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	Validator.LeftyBodyExpressMiddleware(EventValidator),
	leftyPermissionMiddleware('ManageEvent'),
	addevent
);
router.post('/:parent', leftyMemberMiddleware, leftyTokenMiddleware, linkevent);
router.delete('/:id', leftyMemberMiddleware, leftyTokenMiddleware, deleteevent);
router.put(
	'/:id',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	Validator.LeftyPartialBodyExpressMiddleware(EventValidator),
	setevent
);
router.get('/:id', leftyConditionalMemberMiddleware, getevent);
router.get('/:id/viewer', leftyConditionalMemberMiddleware, eventviewer);
router.post(
	'/:id/copy',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	copyValidator.leftyExpressHandler,
	copy
);

export default router;
