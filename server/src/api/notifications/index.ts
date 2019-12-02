import { Router } from 'express';
import { Account, leftyMemberMiddleware } from '../../lib/internals';
import { leftyTokenMiddleware } from '../formtoken';
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

router.get('/admin', leftyMemberMiddleware, adminlist);
router.get('/admin/:id', leftyMemberMiddleware, adminget);
router.post('/admin/:id', leftyMemberMiddleware, leftyTokenMiddleware, adminmarkread);
router.delete('/admin/:id', leftyMemberMiddleware, leftyTokenMiddleware, admindelete);

router.get('/member', leftyMemberMiddleware, memberlist);
router.get('/member/:id', leftyMemberMiddleware, memberget);
router.post('/member/:id', leftyMemberMiddleware, leftyTokenMiddleware, membertoggleread);
router.delete('/member/:id', leftyMemberMiddleware, leftyTokenMiddleware, memberdelete);

router.get('/global', globalget);
router.post('/global', leftyMemberMiddleware, leftyTokenMiddleware, globalcreate);
router.delete('/global', leftyMemberMiddleware, leftyTokenMiddleware, globaltoggleread);

router.get('/', leftyMemberMiddleware, alllist);
router.get('/:id', leftyMemberMiddleware, allget);
router.post('/:id', leftyMemberMiddleware, alltoggleread);

export default router;
