import * as express from 'express';
import {
	Account,
	memberMiddleware,
	NewTaskObjectValidator,
	permissionMiddleware,
	RawTaskObjectValidator,
	Validator
} from '../../lib/internals';
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
	Validator.BodyExpressMiddleware(NewTaskObjectValidator),
	taskcreate
);
router.put(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('AssignTasks'),
	Validator.BodyExpressMiddleware(RawTaskObjectValidator),
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
