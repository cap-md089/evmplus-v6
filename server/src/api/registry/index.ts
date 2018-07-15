import * as express from 'express';

import get from './get';

const router = express.Router();

router.get('/', get);

export default router;