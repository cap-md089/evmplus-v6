import * as express from 'express';
import { tokenMiddleware } from '../../../api/formtoken';
import MemberBase from '../../../lib/Members';
import Team from '../../../lib/Team';
import Validator from '../../../lib/validator/Validator';
import add from './add';
import modify from './modify';
import remove from './remove';

const router = express.Router();

router.put(
	'/',
	tokenMiddleware,
	MemberBase.PermissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	modify
);
router.delete(
	'/',
	tokenMiddleware,
	MemberBase.PermissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.MemberValidator),
	remove
);
router.post(
	'/',
	tokenMiddleware,
	MemberBase.PermissionMiddleware('EditTeam'),
	Validator.BodyExpressMiddleware(Team.Validator),
	add
);

export default router;
