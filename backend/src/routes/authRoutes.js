import { Router } from 'express';
import { enrollFace, loginWithFace, loginWithPassword, upload } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login/password', loginWithPassword);
router.post('/login/face', upload.single('face'), loginWithFace);
router.post('/face/enroll', requireAuth, upload.single('face'), enrollFace);

export default router;
