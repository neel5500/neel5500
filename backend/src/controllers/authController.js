import bcrypt from 'bcryptjs';
import multer from 'multer';
import { query } from '../db/pool.js';
import { issueToken } from '../services/tokenService.js';
import { verifyFace } from '../services/faceAuthService.js';
import { logAudit } from '../utils/audit.js';

export const upload = multer({ storage: multer.memoryStorage() });

export async function loginWithPassword(req, res) {
  const { email, password } = req.body;
  const userResult = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
  const user = userResult.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = issueToken(user);
  await logAudit({ userId: user.id, action: 'LOGIN_PASSWORD', entityType: 'AUTH' });

  return res.json({ token, user: { id: user.id, role: user.role, name: user.full_name, email: user.email } });
}

export async function enrollFace(req, res) {
  const image = req.file;
  if (!image) {
    return res.status(400).json({ message: 'Face image is required' });
  }

  await query('UPDATE users SET face_template = $1 WHERE id = $2', [image.buffer, req.user.sub]);
  await logAudit({ userId: req.user.sub, action: 'FACE_ENROLL', entityType: 'AUTH' });

  return res.json({ message: 'Face enrolled successfully' });
}

export async function loginWithFace(req, res) {
  const { email } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(400).json({ message: 'Face image is required' });
  }

  const userResult = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
  const user = userResult.rows[0];

  if (!user || !user.face_template) {
    return res.status(401).json({ message: 'Face authentication unavailable for user' });
  }

  const result = await verifyFace({ sourceImageBytes: user.face_template, targetImageBytes: image.buffer });

  if (!result.matched) {
    return res.status(401).json({ message: 'Face not matched' });
  }

  const token = issueToken(user);
  await logAudit({ userId: user.id, action: 'LOGIN_FACE', entityType: 'AUTH', metadata: result });

  return res.json({ token, similarity: result.similarity, user: { id: user.id, role: user.role, name: user.full_name } });
}
