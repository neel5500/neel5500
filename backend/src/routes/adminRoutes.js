import { Router } from 'express';
import { createUser, dashboardSummary, listAuditLogs, updateUserStatus } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/dashboard', dashboardSummary);
router.get('/audit-logs', listAuditLogs);
router.post('/users', createUser);
router.patch('/users/:id/status', updateUserStatus);

export default router;
