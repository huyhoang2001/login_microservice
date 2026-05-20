import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';
import { generateToken, hashPassword, verifyPassword } from '../../utils/security.js';

const usersPath = path.resolve(config.DATA_DIR, 'users.json');

export const readUsers = async () => {
  const raw = await fs.readFile(usersPath, 'utf-8');
  return JSON.parse(raw);
};

const writeUsers = async (users) => {
  await fs.writeFile(usersPath, `${JSON.stringify(users, null, 2)}\n`, 'utf-8');
};

export const findUserByEmail = async (email) => {
  const users = await readUsers();
  return users.find((user) => user.email === email?.toLowerCase().trim()) || null;
};

const toUserResponse = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role || 'user',
  createdAt: user.createdAt,
  lastLogin: user.lastLogin,
  profile: user.profile,
});

export const login = async ({ email, password }) => {
  if (!email?.trim() || !password) {
    const error = new Error('Thieu email hoac mat khau');
    error.status = 400;
    throw error;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Tai khoan khong ton tai');
    error.status = 404;
    throw error;
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    const error = new Error('Sai mat khau');
    error.status = 401;
    throw error;
  }

  const token = generateToken(
    { userId: user.id, email: user.email },
    config.JWT_SECRET,
    config.JWT_EXPIRES_IN,
  );

  const users = await readUsers();
  const userIndex = users.findIndex((entry) => entry.id === user.id);
  if (userIndex !== -1) {
    users[userIndex] = { ...user, lastLogin: new Date().toISOString() };
    await writeUsers(users);
  }

  return { token, user: toUserResponse(userIndex === -1 ? user : users[userIndex]) };
};

export const signup = async ({ fullName, email, password }) => {
  if (!fullName?.trim() || !email?.trim() || !password) {
    const error = new Error('Thieu thong tin bat buoc');
    error.status = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Email khong hop le');
    error.status = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Mat khau qua ngan');
    error.status = 400;
    throw error;
  }

  const users = await readUsers();
  const normalizedEmail = email.toLowerCase().trim();
  if (users.some((user) => user.email === normalizedEmail)) {
    const error = new Error('Email da ton tai');
    error.status = 409;
    throw error;
  }

  const user = {
    id: Date.now().toString(),
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: await hashPassword(password),
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    profile: {
      avatar: null,
      bio: '',
      preferences: {},
    },
  };

  users.push(user);
  await writeUsers(users);

  const token = generateToken(
    { userId: user.id, email: user.email },
    config.JWT_SECRET,
    config.JWT_EXPIRES_IN,
  );

  return { token, user: toUserResponse(user) };
};

export const getProfile = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Nguoi dung khong ton tai');
    error.status = 404;
    throw error;
  }

  return toUserResponse(user);
};
