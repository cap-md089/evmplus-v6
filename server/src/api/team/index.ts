import * as express from 'express';
import Account from '../../lib/Account';
import NHQMember from '../../lib/members/NHQMember';
import Team from '../../lib/Team';
import Validator from '../../lib/validator/Validator';
import { tokenMiddleware } from '../formtoken';
// API routes
import create from './create';
import deleteTeam from './delete';
import get from './get';
import list from './list';
import members from './members';
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

router.use('/:id/members', NHQMember.ExpressMiddleware, members);

export default router;
