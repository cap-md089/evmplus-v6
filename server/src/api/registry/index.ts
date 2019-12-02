import * as express from 'express';
import {
	Account,
	leftyMemberMiddleware,
	leftyPermissionMiddleware,
	RegistryValueValidator,
	Validator
} from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
// CRUD functions
import get from './get';
import set from './set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', get);
router.post(
	'/',
	leftyMemberMiddleware,
	leftyTokenMiddleware,
	leftyPermissionMiddleware('RegistryEdit'),
	Validator.LeftyPartialBodyExpressMiddleware(RegistryValueValidator),
	set
);

export default router;
