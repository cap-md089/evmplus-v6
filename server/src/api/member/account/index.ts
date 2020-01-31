import { Router } from 'express';
import { Account, Validator } from '../../../lib/internals';
import finishaccount, { nhqFinishValidator } from './nhq/finishaccount';
import finishpasswordreset from './nhq/finishpasswordreset';
import requestaccount, { nhqRequestValidator } from './nhq/requestaccount';
import requestpasswordreset from './nhq/requestpasswordreset';
import requestusername from './nhq/requestusername';

const router = Router();

router.post('/capnhq/username', requestusername());
router.post('/capnhq/requestpassword', requestpasswordreset());
router.post('/capnhq/finishpasswordreset', finishpasswordreset);

router.use(Account.LeftyExpressMiddleware);

router.post(
	'/capnhq/request',
	Validator.LeftyBodyExpressMiddleware(nhqRequestValidator),
	requestaccount
);
router.post(
	'/capnhq/finish',
	Validator.LeftyBodyExpressMiddleware(nhqFinishValidator),
	finishaccount
);

export default router;
