import * as express from 'express';
import {
	Account,
	conditionalMemberMiddleware,
	memberMiddleware,
	NewTeamMemberValidator,
	NewTeamObjectValidator,
	permissionMiddleware,
	Validator
} from '../../lib/internals';
import { tokenMiddleware } from '../formtoken';
// API routes
import create from './create';
import deleteTeam from './delete';
import get from './get';
import list from './list';
import add from './members/add';
import listmembers from './members/list';
import modify from './members/modify';
import remove from './members/remove';
import set from './set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', memberMiddleware, list);
router.get('/:id', memberMiddleware, get);
router.post(
	'/',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('ManageTeam'),
	Validator.BodyExpressMiddleware(NewTeamObjectValidator),
	create
);
router.put(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('ManageTeam'),
	Validator.PartialBodyExpressMiddleware(NewTeamObjectValidator),
	set
);
router.delete(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('ManageTeam'),
	deleteTeam
);

router.put(
	'/:id/members',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('ManageTeam'),
	Validator.BodyExpressMiddleware(NewTeamMemberValidator),
	modify
);
router.delete(
	'/:id/members',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('ManageTeam'),
	Validator.BodyExpressMiddleware(NewTeamMemberValidator),
	remove
);
router.post(
	'/:id/members',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('ManageTeam'),
	Validator.BodyExpressMiddleware(NewTeamMemberValidator),
	add
);
router.get('/:id/members', conditionalMemberMiddleware, listmembers);

export default router;
