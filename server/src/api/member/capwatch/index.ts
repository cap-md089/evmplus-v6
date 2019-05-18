import { Router } from 'express';
import Validator from '../../../lib/validator/Validator';
import _import from './import';
import list from './list';

const router = Router();

router.get('/', list);
router.post(
	'/',
	Validator.BodyExpressMiddleware(
		new Validator<{ orgids: string[] }>({
			orgids: {
				validator: Validator.ArrayOf(Validator.String)
			}
		})
	),
	// import is a reserved JS keyword :/
	_import
);

export default router;
