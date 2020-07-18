import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
// Attendance
import addattendance from './attendance/addattendance';
import addattendancebulk from './attendance/addattendancebulk';
// import attendancelogcadet from './attendance/attendancelogcadet';
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

// router.get('/:id/attendance/log/cadet', attendancelogcadet);
// router.get('/:id/attendance/log/senior', conditionalMemberMiddleware, attendancelogsenior);
// router.get('/:id/attendance/roster', conditionalMemberMiddleware, attendanceroster);

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, addattendance);
addAPI(Validator, adder, addattendancebulk);
addAPI(Validator, adder, deleteattendance);
addAPI(Validator, adder, getattendance);
addAPI(Validator, adder, modifyattendance);

addAPI(Validator, adder, adddebrief);
addAPI(Validator, adder, deletedebrief);

addAPI(Validator, adder, addevent);
addAPI(Validator, adder, copy);
addAPI(Validator, adder, deleteevent);
addAPI(Validator, adder, eventviewer);
addAPI(Validator, adder, list);
addAPI(Validator, adder, getnextrecurring);
addAPI(Validator, adder, listupcoming);
addAPI(Validator, adder, linkevent);
addAPI(Validator, adder, setevent);
addAPI(Validator, adder, getevent);
addAPI(Validator, adder, timelist);

export default router;
