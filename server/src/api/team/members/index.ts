import { Router } from 'express';
import add from './add';
import modify from './modify';
import remove from './remove';

const router = Router();

router.put('/', modify);
router.delete('/', remove);
router.post('/', add);

export default router;
