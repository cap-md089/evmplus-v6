/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import { addAPI } from 'auto-client-api';
import { Validator } from 'common-lib';
import * as express from 'express';
import { endpointAdder } from '../../lib/API';
// Event accounts
import create from './accounts/create';
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
import getaudit from './events/getaudit';
import getevent from './events/getevent';
import getnextrecurring from './events/getnextrecurring';
import linkevent from './events/linkevent';
import list from './events/list';
import listupcoming from './events/listupcoming';
import setevent from './events/setevent';
import shortlist from './events/shortlist';
import timelist from './events/timelist';

const router = express.Router();

const adder = endpointAdder(router) as () => () => void;

addAPI(Validator, adder, create);

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
addAPI(Validator, adder, shortlist);
addAPI(Validator, adder, getnextrecurring);
addAPI(Validator, adder, listupcoming);
addAPI(Validator, adder, linkevent);
addAPI(Validator, adder, setevent);
addAPI(Validator, adder, getevent);
addAPI(Validator, adder, getaudit);
addAPI(Validator, adder, timelist);

export default router;
