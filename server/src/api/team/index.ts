import * as express from 'express';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
import NHQMember from '../../lib/members/NHQMember';
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

router.get('/', NHQMember.ConditionalExpressMiddleware, list);
router.get('/:id', NHQMember.ConditionalExpressMiddleware, get);
router.post(
	'/',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	NHQMember.PermissionMiddleware('AddTeam'),
	Validator.BodyExpressMiddleware(Team.Validator),
	create
);
router.put(
	'/:id',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	NHQMember.PermissionMiddleware('EditTeam'),
	Validator.PartialBodyExpressMiddleware(Team.Validator),
	set
);
router.delete(
	'/:id',
	NHQMember.ExpressMiddleware,
	tokenMiddleware,
	NHQMember.PermissionMiddleware('EditTeam'),
	deleteTeam
);

router.put(
	'/:id/members',
	tokenMiddleware,
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	modify
);
router.delete(
	'/:id/members',
	tokenMiddleware,
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	remove
);
router.post(
	'/:id/members',
	tokenMiddleware,
	MemberBase.ExpressMiddleware,
	MemberBase.PermissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	add
);
router.get(
	'/:id/members',
	MemberBase.ConditionalExpressMiddleware,
	listmembers
);

export default router;
