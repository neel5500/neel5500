import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}
