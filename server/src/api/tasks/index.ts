import * as express from 'express';
import Account from '../../lib/Account';
import { memberMiddleware, permissionMiddleware } from '../../lib/member/pam/Session';
import Task from '../../lib/Task';
import Validator from '../../lib/validator/Validator';
import { tokenMiddleware } from '../formtoken';
import taskcreate from './taskcreate';
import taskdelete from './taskdelete';
import taskedit from './taskedit';
import taskget from './taskget';
import tasklist from './tasklist';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', memberMiddleware, tasklist);
router.get('/:id', memberMiddleware, taskget);
router.post(
	'/',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('AssignTasks'),
	Validator.BodyExpressMiddleware(Task.Validator),
	taskcreate
);
router.put(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('AssignTasks'),
	Validator.BodyExpressMiddleware(Task.RawValidator),
	taskedit
);
router.delete(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('AssignTasks'),
	taskdelete
);

export default router;
