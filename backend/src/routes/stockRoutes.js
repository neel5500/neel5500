import { Router } from 'express';
import { createInward, createOutward, listStock } from '../controllers/stockController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listStock);
router.post('/inward', requireRole('ADMIN', 'MANAGER'), createInward);
router.post('/outward', requireRole('ADMIN', 'MANAGER'), createOutward);

export default router;
