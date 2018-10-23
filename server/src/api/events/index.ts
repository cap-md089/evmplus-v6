import * as express from 'express';
import Account from '../../lib/Account';
import NHQMember from '../../lib/members/NHQMember';
// Attendance
import addattendance from './attendance/addattendance';
import deleteattendance from './attendance/deleteattendance';
import getattendance from './attendance/getattendance';
import modifyattendance from './attendance/modifyattendance';
// Event handlers
import addevent from './events/addevent';
import deleteevent from './events/deleteevent';
import getevent from './events/getevent';
import linkevent from './events/linkevent';
import list from './events/list';
import setevent from './events/setevent';
import timelist from './events/timelist';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', NHQMember.ConditionalExpressMiddleware, list);
router.get('/:start/:end', NHQMember.ConditionalExpressMiddleware, timelist);
router.post('/', NHQMember.ExpressMiddleware, addevent);
router.post('/:parent', NHQMember.ExpressMiddleware, linkevent);
router.delete('/:id', NHQMember.ExpressMiddleware, deleteevent);
router.put('/:id', NHQMember.ExpressMiddleware, setevent);
router.get('/:id', NHQMember.ConditionalExpressMiddleware, getevent);

router.get('/:id/attendance', NHQMember.ExpressMiddleware, getattendance);
router.post('/:id/attendance', NHQMember.ExpressMiddleware, addattendance);
router.put('/:id/attendance', NHQMember.ExpressMiddleware, modifyattendance);
router.delete('/:id/attendance', NHQMember.ExpressMiddleware, deleteattendance);

export default router;
