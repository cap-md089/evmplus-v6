import { Router } from 'express';
import _import from './import';

const router = Router();

router.post(
	'/import',
	// import is a reserved JS keyword :/
	_import
);

export default router;
