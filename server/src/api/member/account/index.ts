import { Router } from 'express';
import { Validator } from '../../../lib/internals';
import finishaccount, { nhqFinishValidator } from './nhq/finishaccount';
import requestaccount, { nhqRequestValidator } from './nhq/requestaccount';

const router = Router();

router.post(
	'/nhq/request',
	Validator.LeftyBodyExpressMiddleware(nhqRequestValidator),
	requestaccount
);
router.post('/nhq/finish', Validator.LeftyBodyExpressMiddleware(nhqFinishValidator), finishaccount);

export default router;
