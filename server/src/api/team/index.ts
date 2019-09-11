import * as express from 'express';
import Account from '../../lib/Account';
import {
	conditionalMemberMiddleware,
	memberMiddleware,
	permissionMiddleware
} from '../../lib/member/pam/Session';
import Team from '../../lib/Team';
import Validator from '../../lib/validator/Validator';
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
	permissionMiddleware('AddTeam'),
	Validator.BodyExpressMiddleware(Team.Validator),
	create
);
router.put(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('EditTeam'),
	Validator.PartialBodyExpressMiddleware(Team.Validator),
	set
);
router.delete(
	'/:id',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('EditTeam'),
	deleteTeam
);

router.put(
	'/:id/members',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	modify
);
router.delete(
	'/:id/members',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	remove
);
router.post(
	'/:id/members',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	add
);
router.get('/:id/members', conditionalMemberMiddleware, listmembers);

export default router;
