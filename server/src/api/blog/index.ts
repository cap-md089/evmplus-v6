import * as express from 'express';

import page from './page';
import post from './post';

const router = express.Router();

router.use('/post', post);
router.use('/page', page);

export default router;
