import * as express from 'express';
import {
	Account,
	conditionalMemberMiddleware,
	leftyConditionalMemberMiddleware,
	leftyMemberMiddleware,
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
import copy from './events/copy';
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

router.get('/upcoming', Account.LeftyExpressMiddleware, listupcoming);
router.get('/recurring', Account.LeftyExpressMiddleware, getnextrecurring);

// These APIs use Account transformers, not middleware
router.get('/:id', getevent);
router.post('/:id/copy', copy);
router.post('/', addevent);
router.get('/:id/viewer', eventviewer);
router.put('/:id', setevent);

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
router.get('/:start/:end', conditionalMemberMiddleware, timelist);
router.post('/:parent', leftyMemberMiddleware, leftyTokenMiddleware, linkevent);
router.delete('/:id', leftyMemberMiddleware, leftyTokenMiddleware, deleteevent);

export default router;
