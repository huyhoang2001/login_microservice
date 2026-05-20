// Security utilities: password hashing, token generation, sanitization.
// Centralize all security-sensitive operations here.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (plain) => bcrypt.hash(plain, 10);

export const verifyPassword = async (plain, hash) => bcrypt.compare(plain, hash);

export const generateToken = (payload, secret, expiresIn) => (
  jwt.sign(payload, secret, { expiresIn })
);
