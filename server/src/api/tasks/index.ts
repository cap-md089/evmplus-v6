import * as express from 'express';
import {
	Account,
	leftyMemberMiddleware,
	leftyPermissionMiddleware,
	memberMiddleware,
	NewTaskObjectValidator,
	RawTaskObjectValidator,
	Validator
} from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
import taskcreate from './taskcreate';
import taskdelete from './taskdelete';
import taskedit from './taskedit';
import taskget from './taskget';
import tasklist from './tasklist';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', memberMiddleware, tasklist);
router.get('/:id', leftyMemberMiddleware, taskget);
router.post(
	'/',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('AssignTasks'),
	Validator.LeftyBodyExpressMiddleware(NewTaskObjectValidator),
	taskcreate
);
router.put(
	'/:id',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('AssignTasks'),
	Validator.BodyExpressMiddleware(RawTaskObjectValidator),
	taskedit
);
router.delete(
	'/:id',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('AssignTasks'),
	taskdelete
);

export default router;
