import * as express from 'express';
import {
	Account,
	conditionalMemberMiddleware,
	leftyConditionalMemberMiddleware,
	leftyMemberMiddleware,
	leftyPermissionMiddleware,
	NewTeamMemberValidator,
	NewTeamObjectValidator,
	Validator
} from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
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

router.get('/', conditionalMemberMiddleware, list);
router.get('/:id', leftyConditionalMemberMiddleware, get);
router.post(
	'/',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('ManageTeam'),
	Validator.LeftyBodyExpressMiddleware(NewTeamObjectValidator),
	create
);
router.put(
	'/:id',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('ManageTeam'),
	Validator.LeftyPartialBodyExpressMiddleware(NewTeamObjectValidator),
	set
);
router.delete(
	'/:id',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('ManageTeam'),
	deleteTeam
);

router.put(
	'/:id/members',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('ManageTeam'),
	Validator.LeftyBodyExpressMiddleware(NewTeamMemberValidator),
	modify
);
router.delete(
	'/:id/members',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('ManageTeam'),
	Validator.LeftyBodyExpressMiddleware(NewTeamMemberValidator),
	remove
);
router.post(
	'/:id/members',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('ManageTeam'),
	Validator.LeftyBodyExpressMiddleware(NewTeamMemberValidator),
	add
);
router.get('/:id/members', conditionalMemberMiddleware, listmembers);

export default router;
