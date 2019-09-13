import { Router } from 'express';
import { Validator } from '../../../lib/internals';
import finishaccount, { nhqFinishValidator } from './nhq/finishaccount';
import requestaccount, { nhqRequestValidator } from './nhq/requestaccount';

const router = Router();

router.post('/nhq/request', Validator.BodyExpressMiddleware(nhqRequestValidator), requestaccount);
router.post('/nhq/finish', Validator.BodyExpressMiddleware(nhqFinishValidator), finishaccount);

export default router;
