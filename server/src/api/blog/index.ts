import * as express from 'express';

import post from './post';

const router = express.Router();

router.use('/post', post);

export default router;
