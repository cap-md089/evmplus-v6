import { Router } from 'express';
import _import from './import';

const router = Router();

router.get(
	'/import/:token/:list',
	// import is a reserved JS keyword :/
	_import
);

export default router;
