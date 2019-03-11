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
router.use(MemberBase.ExpressMiddleware);
router.use(tokenMiddleware);

router.get('/admin', adminlist);
router.get('/admin/:id', adminget);
router.post('/admin/:id', adminmarkread);
router.delete('/admin/:id', admindelete);

router.get('/member', memberlist);
router.get('/member/:id', memberget);
router.post('/member/:id', membermarkread);
router.delete('/member/:id', memberdelete);

router.get('/global', globalget);
router.post('/global', globalcreate);
router.delete('/global', globalmarkread);