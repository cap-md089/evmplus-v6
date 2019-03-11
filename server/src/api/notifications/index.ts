import { Router } from 'express';
import Account from '../../lib/Account';
import MemberBase from '../../lib/Members';
import { tokenMiddleware } from '../formtoken';
// Admin Notification APIs
import admindelete from './admin/delete';
import adminget from './admin/get';
import adminlist from './admin/list';
import adminmarkread from './admin/markread';
// Global notifications
import globalcreate from './global/createglobal';
import globalget from './global/get';
import globalmarkread from './global/markread';
// Member Notification APIs
import memberdelete from './member/delete';
import memberget from './member/get';
import memberlist from './member/list';
import membermarkread from './member/markread';

const router = Router();

router.use(Account.ExpressMiddleware);

router.get('/admin', MemberBase.ExpressMiddleware, adminlist);
router.get('/admin/:id', MemberBase.ExpressMiddleware, adminget);
router.post('/admin/:id', MemberBase.ExpressMiddleware, tokenMiddleware, adminmarkread);
router.delete('/admin/:id', MemberBase.ExpressMiddleware, tokenMiddleware, admindelete);

router.get('/member', MemberBase.ExpressMiddleware, memberlist);
router.get('/member/:id', MemberBase.ExpressMiddleware, memberget);
router.post('/member/:id', MemberBase.ExpressMiddleware, tokenMiddleware, membermarkread);
router.delete('/member/:id', MemberBase.ExpressMiddleware, tokenMiddleware, memberdelete);

router.get('/global', globalget);
router.post('/global', MemberBase.ExpressMiddleware, tokenMiddleware, globalcreate);
router.delete('/global', MemberBase.ExpressMiddleware, tokenMiddleware, globalmarkread);

export default router;
