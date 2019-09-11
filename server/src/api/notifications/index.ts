import { Router } from 'express';
import Account from '../../lib/Account';
import { memberMiddleware } from '../../lib/member/pam/Session';
import { tokenMiddleware } from '../formtoken';
// Admin Notification APIs
import admindelete from './admin/delete';
import adminget from './admin/get';
import adminlist from './admin/list';
import adminmarkread from './admin/toggleread';
// Notification APIs for all the notification types
import allget from './allget';
import alllist from './alllist';
import alltoggleread from './alltoggleread';
// Global notifications
import globalcreate from './global/createglobal';
import globalget from './global/get';
import globaltoggleread from './global/markread';
// Member Notification APIs
import memberdelete from './member/delete';
import memberget from './member/get';
import memberlist from './member/list';
import membertoggleread from './member/toggleread';

const router = Router();

router.use(Account.ExpressMiddleware);

router.get('/admin', memberMiddleware, adminlist);
router.get('/admin/:id', memberMiddleware, adminget);
router.post('/admin/:id', memberMiddleware, tokenMiddleware, adminmarkread);
router.delete('/admin/:id', memberMiddleware, tokenMiddleware, admindelete);

router.get('/member', memberMiddleware, memberlist);
router.get('/member/:id', memberMiddleware, memberget);
router.post('/member/:id', memberMiddleware, tokenMiddleware, membertoggleread);
router.delete('/member/:id', memberMiddleware, tokenMiddleware, memberdelete);

router.get('/global', globalget);
router.post('/global', memberMiddleware, tokenMiddleware, globalcreate);
router.delete('/global', memberMiddleware, tokenMiddleware, globaltoggleread);

router.get('/', memberMiddleware, alllist);
router.get('/:id', memberMiddleware, allget);
router.post('/:id', memberMiddleware, alltoggleread);

export default router;
