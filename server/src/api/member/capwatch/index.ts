import { Router } from 'express';
import _import from './import';
import list from './list';

const router = Router();

router.get('/', list);
router.get(
	'/import/:token/:list',
	// import is a reserved JS keyword :/
	_import
);

export default router;
