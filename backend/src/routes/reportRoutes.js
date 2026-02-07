import { Router } from 'express';
import { reportSummary, searchStock } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/search', searchStock);
router.get('/summary', reportSummary);

export default router;
