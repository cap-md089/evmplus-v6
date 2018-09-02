import * as express from 'express';
import getmembers from './getmembers';

const router = express.Router();

router.get('/list', getmembers);

export default router;