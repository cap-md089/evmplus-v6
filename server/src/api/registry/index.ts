import * as express from 'express';
import {
	Account,
	memberMiddleware,
	permissionMiddleware,
	RegistryValueValidator,
	Validator
} from '../../lib/internals';
import { tokenMiddleware } from '../formtoken';
// CRUD functions
import get from './get';
import set from './set';

const router = express.Router();

router.use(Account.ExpressMiddleware);

router.get('/', get);
router.post(
	'/',
	memberMiddleware,
	tokenMiddleware,
	permissionMiddleware('RegistryEdit'),
	Validator.PartialBodyExpressMiddleware(RegistryValueValidator),
	set
);

export default router;
