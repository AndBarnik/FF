import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const given = scryptSync(password, salt, 64);
  return timingSafeEqual(given, Buffer.from(hash, 'hex'));
}

export const signToken = (userId) => jwt.sign({ sub: userId }, SECRET, { expiresIn: '30d' });

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET).sub;
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const userId = verifyToken(header.replace(/^Bearer /, ''));
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  req.userId = userId;
  next();
}
