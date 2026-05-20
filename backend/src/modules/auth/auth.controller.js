import * as authService from './auth.service.js';
import captchaService from '../../../services/captchaService.js';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { extractBearerToken } from '../../utils/requestHelpers.js';

const verifyCaptchaPayload = async (body) => {
  const { captchaSessionId, captchaPosition, captchaDuration, dragHistory } = body;

  if (!captchaSessionId || captchaPosition == null || captchaDuration == null) {
    const error = new Error('Captcha chua duoc xac thuc');
    error.status = 400;
    throw error;
  }

  const result = await captchaService.verifyCaptcha(
    captchaSessionId,
    Number(captchaPosition),
    Number(captchaDuration),
    dragHistory,
  );

  if (!result.valid) {
    const error = new Error(result.reason || 'Captcha khong hop le');
    error.status = 400;
    throw error;
  }
};

const getTokenFromCookies = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='))
    ?.split('=')[1] || null;
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const login = async (req, res, next) => {
  try {
    await verifyCaptchaPayload(req.body || {});
    const result = await authService.login(req.body || {});
    setAuthCookie(res, result.token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const signup = async (req, res, next) => {
  try {
    await verifyCaptchaPayload(req.body || {});
    const result = await authService.signup(req.body || {});
    setAuthCookie(res, result.token);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const profile = async (req, res, next) => {
  try {
    const token = extractBearerToken(req) || getTokenFromCookies(req);
    if (!token) {
      return res.status(401).json({ error: 'Token khong ton tai' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await authService.getProfile(decoded.email);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Dang xuat thanh cong' });
};
