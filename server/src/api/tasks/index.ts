import * as express from 'express';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
import Task from '../../lib/Task';
import Validator from '../../lib/validator/Validator';
import { tokenMiddleware } from '../formtoken';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', MemberBase.ExpressMiddleware);
router.get('/:id', MemberBase.ExpressMiddleware);
router.post(
	'/',
	MemberBase.ExpressMiddleware,
	tokenMiddleware,
	MemberBase.PermissionMiddleware('AssignTasks'),
	Validator.BodyExpressMiddleware(Task.Validator)
);
router.put(
	'/:id',
	MemberBase.ExpressMiddleware,
	tokenMiddleware,
	MemberBase.PermissionMiddleware('AssignTasks'),
	Validator.BodyExpressMiddleware(Task.RawValidator)
);
router.delete(
	'/:id',
	MemberBase.ExpressMiddleware,
	tokenMiddleware,
	MemberBase.PermissionMiddleware('AssignTasks')
);

export default router;