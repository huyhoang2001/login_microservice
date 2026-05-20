import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { extractBearerToken } from '../utils/requestHelpers.js';
import { findUserByEmail } from '../modules/auth/auth.service.js';

const getTokenFromCookies = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='))
    ?.split('=')[1] || null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req) || getTokenFromCookies(req);
    if (!token) {
      return res.status(401).json({ error: 'Token khong ton tai' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await findUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'Nguoi dung khong ton tai' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token khong hop le' });
  }
};
