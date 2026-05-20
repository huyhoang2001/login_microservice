// backend/server.js
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import captchaService from './services/captchaService.js';
import { addUser, emailExists, findUserByEmail, getUsersCount, readUsers, writeUsers } from './utils/fileStorage.js';
import { extractBearerToken, getClientIP } from './utils/requestHelpers.js';
import { maskSensitiveData, maskToken } from './utils/security.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-key';
const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : process.env.NODE_ENV === 'production';
const historyDataDir = path.join(projectRoot, 'backend', 'data', 'history');
const historyImageDir = path.join(projectRoot, 'backend', 'assets', 'image_history');
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
let historyDataCache = null;

const allowedHistoryImageFolders = new Set([
  'characters',
  'cultures',
  'dynasties',
  'icons',
  'maps'
]);

const FIELD_FOLDER_MAP = {
  banner: 'dynasties',
  emblem: 'icons',
  map: 'maps',
  artifacts: 'dynasties',
  portrait: 'characters',
  statue: 'characters',
  gallery: 'characters',
};

const historyImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    const fieldName = String(req.body?.field || '').toLowerCase();
    const mappedFolder = FIELD_FOLDER_MAP[fieldName];
    const requestedFolder = String(req.body?.folder || mappedFolder || 'dynasties').toLowerCase();
    const folder = allowedHistoryImageFolders.has(requestedFolder) ? requestedFolder : 'dynasties';
    const targetDir = path.join(historyImageDir, folder);
    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const base = path
      .basename(file.originalname, ext)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'image';
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const historyImageUpload = multer({
  storage: historyImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowedMime = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    if (!allowedMime.has(file.mimetype) || !allowedExt.has(ext)) {
      return cb(new Error('Chi ho tro JPG, JPEG, PNG, WEBP'));
    }
    return cb(null, true);
  }
});

const toUnixPath = (value) => String(value || '').replace(/\\/g, '/');

const normalizeHistoryImagePath = (value) => {
  if (typeof value !== 'string') return value;
  const normalized = toUnixPath(value.trim());
  if (!normalized) return normalized;
  if (normalized.startsWith('/api/history/images/')) return normalized;
  if (normalized.startsWith('assets/')) {
    const relative = normalized.replace(/^assets\//, '');
    return `/api/history/images/${relative}`;
  }
  return normalized;
};

const normalizeImagePathsDeep = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeImagePathsDeep);
  }
  if (!value || typeof value !== 'object') {
    return normalizeHistoryImagePath(value);
  }

  const output = {};
  Object.entries(value).forEach(([key, entry]) => {
    output[key] = normalizeImagePathsDeep(entry);
  });
  return output;
};

const collectImageStrings = (value, output = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectImageStrings(item, output));
    return output;
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      const pathValue = normalizeHistoryImagePath(value);
      if (pathValue.startsWith('/api/history/images/')) output.add(pathValue);
    }
    return output;
  }
  Object.values(value).forEach((entry) => collectImageStrings(entry, output));
  return output;
};

console.log('🚀 Server starting on port', PORT);

// CORS
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use('/api/history/images', express.static(historyImageDir));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(projectRoot, 'dist')));
}

const getTokenFromCookies = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='))
    ?.split('=')[1] || null;
};

// Middleware to check authentication for admin routes
const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req) || getTokenFromCookies(req);
    if (!token) {
      // For HTML requests, redirect to login
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
      }
      return res.status(401).json({ error: 'Token không tồn tại' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserByEmail(decoded.email);
    
    if (!user) {
      // For HTML requests, redirect to login
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
      }
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    req.user = user;
    next();
  } catch (error) {
    // For HTML requests, redirect to login
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Helper function for formatted logging
const logWithTimezone = (message, data = null) => {
  const now = new Date();
  const timestamp = now.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] Data:`, data);
  }
};

// Enhanced logging middleware
app.use((req, res, next) => {
  const clientIP = getClientIP(req);
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  logWithTimezone(`🌐 ${req.method} ${req.path}`, {
    ip: clientIP,
    userAgent: userAgent.substring(0, 50) + '...'
  });
  
  // Log body with masked sensitive data
  if (req.body && Object.keys(req.body).length > 0) {
    const maskedBody = maskSensitiveData(req.body);
    logWithTimezone('📥 Request body', maskedBody);
  }
  
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  const usersCount = await getUsersCount();
  logWithTimezone('❤️ Health check requested', { totalUsers: usersCount });
  
  res.json({ 
    status: 'OK', 
    users: usersCount,
    storage: 'JSON File',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Ho_Chi_Minh',
    server: 'MyApp Backend'
  });
});

// Debug users
app.get('/api/debug/users', async (req, res) => {
  const users = await readUsers();
  const safeUsers = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  }));
  
  logWithTimezone('🐛 Debug users requested', { 
    totalUsers: users.length,
    requestedBy: getClientIP(req)
  });
  
  res.json({
    total: users.length,
    users: safeUsers,
    storage: 'JSON File'
  });
});

const verifyCaptchaPayload = async (body, clientIP) => {
  const { captchaSessionId, captchaPosition, captchaDuration, dragHistory } = body;

  if (!captchaSessionId || captchaPosition == null || captchaDuration == null) {
    return {
      valid: false,
      error: 'Captcha chưa được xác thực. Vui lòng kéo thanh xác minh.'
    };
  }

  const result = await captchaService.verifyCaptcha(
    captchaSessionId,
    Number(captchaPosition),
    Number(captchaDuration),
    dragHistory
  );

  if (!result.valid) {
    logWithTimezone('❌ CAPTCHA VERIFICATION FAILED', {
      captchaSessionId,
      fromIP: clientIP,
      reason: result.reason,
      accuracy: result.accuracy
    });

    return {
      valid: false,
      error: result.reason || 'Captcha không hợp lệ'
    };
  }

  logWithTimezone('✅ CAPTCHA VERIFIED', {
    captchaSessionId,
    fromIP: clientIP,
    accuracy: result.accuracy
  });

  return { valid: true, accuracy: result.accuracy };
};

app.get('/api/captcha/session', async (req, res) => {
  try {
    const session = await captchaService.generateCaptcha();
    res.json(session);
  } catch (error) {
    logWithTimezone('💥 CAPTCHA SESSION ERROR', { error: error.message });
    res.status(500).json({ error: 'Không thể tạo captcha mới' });
  }
});

app.get('/api/captcha/image/:sessionId/background', async (req, res) => {
  try {
    const image = await captchaService.getBackgroundImage(req.params.sessionId);
    res.set('Cache-Control', 'private, max-age=300');
    res.type('png').send(image);
  } catch (error) {
    res.status(404).json({ error: 'Captcha background không tồn tại' });
  }
});

app.get('/api/captcha/image/:sessionId/puzzle', async (req, res) => {
  try {
    const image = await captchaService.getPuzzleImage(req.params.sessionId);
    res.set('Cache-Control', 'private, max-age=300');
    res.type('png').send(image);
  } catch (error) {
    res.status(404).json({ error: 'Captcha puzzle không tồn tại' });
  }
});

app.post('/api/captcha/verify', async (req, res) => {
  try {
    const { sessionId, userX, duration, dragHistory } = req.body;

    if (!sessionId || userX == null || duration == null) {
      return res.status(400).json({ error: 'Payload captcha không hợp lệ' });
    }

    const result = await captchaService.verifyCaptcha(
      sessionId,
      Number(userX),
      Number(duration),
      dragHistory,
    );

    if (!result.valid) {
      return res.status(400).json({ error: result.reason || 'Captcha không hợp lệ' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xác thực captcha' });
  }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const clientIP = getClientIP(req);

    logWithTimezone('📝 SIGNUP ATTEMPT', {
      email: email,
      fullName: fullName,
      fromIP: clientIP
    });

    // Validation
    const captchaResult = await verifyCaptchaPayload(req.body, clientIP);
    if (!captchaResult.valid) {
      return res.status(400).json({ error: captchaResult.error });
    }

    if (!fullName?.trim() || !email?.trim() || !password) {
      logWithTimezone('❌ SIGNUP FAILED - Missing required fields', {
        email: email,
        hasFullName: !!fullName?.trim(),
        hasEmail: !!email?.trim(),
        hasPassword: !!password
      });
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logWithTimezone('❌ SIGNUP FAILED - Invalid email format', { email: email });
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    if (password.length < 6) {
      logWithTimezone('❌ SIGNUP FAILED - Password too short', { 
        email: email,
        passwordLength: password.length 
      });
      return res.status(400).json({ error: 'Mật khẩu quá ngắn' });
    }

    // Check if email already exists
    const emailInUse = await emailExists(email);
    if (emailInUse) {
      logWithTimezone('❌ SIGNUP FAILED - Email already exists', { email: email });
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      profile: {
        avatar: null,
        bio: '',
        preferences: {}
      }
    };

    // Save to JSON file
    const saved = await addUser(user);
    if (!saved) {
      logWithTimezone('❌ SIGNUP FAILED - Could not save user', { 
        email: email,
        userId: userId 
      });
      return res.status(500).json({ error: 'Không thể lưu tài khoản' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user data for response
    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      profile: user.profile
    };

    logWithTimezone('✅ SIGNUP SUCCESS', {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      token: maskToken(token),
      fromIP: clientIP
    });

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: userData
    });

  } catch (error) {
    logWithTimezone('💥 SIGNUP ERROR', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = getClientIP(req);

    logWithTimezone('🔐 LOGIN ATTEMPT', {
      email: email,
      fromIP: clientIP
    });

    const captchaResult = await verifyCaptchaPayload(req.body, clientIP);
    if (!captchaResult.valid) {
      return res.status(400).json({ error: captchaResult.error });
    }

    if (!email?.trim() || !password) {
      logWithTimezone('❌ LOGIN FAILED - Missing credentials', { email: email });
      return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    }

    // Find user in JSON file
    const user = await findUserByEmail(email);
    if (!user) {
      logWithTimezone('❌ LOGIN FAILED - User not found', { email: email });
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logWithTimezone('❌ LOGIN FAILED - Invalid password', { 
        userId: user.id,
        email: user.email 
      });
      return res.status(401).json({ error: 'Sai mật khẩu' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = user;
      await writeUsers(users);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user data for response
    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      profile: user.profile
    };

    logWithTimezone('✅ LOGIN SUCCESS', {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      lastLogin: user.lastLogin,
      token: maskToken(token),
      fromIP: clientIP
    });
    
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: userData
    });

  } catch (error) {
    logWithTimezone('💥 LOGIN ERROR', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get user profile endpoint
app.get('/api/profile', async (req, res) => {
  try {
    const token = extractBearerToken(req) || getTokenFromCookies(req);
    const clientIP = getClientIP(req);
    
    if (!token) {
      logWithTimezone('❌ PROFILE ACCESS FAILED - No token', { fromIP: clientIP });
      return res.status(401).json({ error: 'Token không tồn tại' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserByEmail(decoded.email);
    
    if (!user) {
      logWithTimezone('❌ PROFILE ACCESS FAILED - User not found', { 
        email: decoded.email,
        fromIP: clientIP 
      });
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      profile: user.profile
    };

    logWithTimezone('✅ PROFILE ACCESS SUCCESS', {
      userId: user.id,
      email: user.email,
      fromIP: clientIP
    });

    res.json({ user: userData });

  } catch (error) {
    const clientIP = getClientIP(req);
    logWithTimezone('💥 PROFILE ERROR', {
      error: error.message,
      fromIP: clientIP
    });
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
});

// Logout tracking endpoint (optional)
app.post('/api/logout', async (req, res) => {
  try {
    const token = extractBearerToken(req) || getTokenFromCookies(req);
    const clientIP = getClientIP(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        logWithTimezone('🚪 LOGOUT SUCCESS', {
          userId: decoded.userId,
          email: decoded.email,
          fromIP: clientIP
        });
      } catch (jwtError) {
        logWithTimezone('🚪 LOGOUT - Invalid token', { fromIP: clientIP });
      }
    } else {
      logWithTimezone('🚪 LOGOUT - No token provided', { fromIP: clientIP });
    }
    
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Đăng xuất thành công' });
    
  } catch (error) {
    logWithTimezone('💥 LOGOUT ERROR', {
      error: error.message
    });
    res.status(500).json({ error: 'Lỗi server' });
  }
});
const loadHistoryData = async () => {
  if (historyDataCache) {
    return historyDataCache;
  }

  const [detailedRaw, dynastyRaw, calendarRaw] = await Promise.all([
    readFile(path.join(historyDataDir, 'data_detailed.json'), 'utf-8'),
    readFile(path.join(historyDataDir, 'data_trieudai.json'), 'utf-8'),
    readFile(path.join(historyDataDir, 'data_lichnienbieu.json'), 'utf-8')
      .catch(() => readFile(path.join(historyDataDir, 'data_data_lichnienbieu.json'), 'utf-8'))
      .catch(() => '[]')
  ]);

  historyDataCache = {
    detailedData: JSON.parse(detailedRaw),
    dynastyData: JSON.parse(dynastyRaw),
    calendarData: JSON.parse(calendarRaw)
  };

  return historyDataCache;
};

app.get('/api/history/public/data', async (req, res) => {
  try {
    const data = await loadHistoryData();
    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Khong the tai du lieu lich su' });
  }
});

app.get('/api/history/admin/data', requireAuth, async (req, res) => {
  try {
    const data = await loadHistoryData();
    res.set('Cache-Control', 'private, max-age=120');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Khong the tai du lieu admin' });
  }
});

app.post('/api/history/admin/images', requireAuth, historyImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Khong co file anh' });
    }

    const folder = path.basename(req.file.destination);
    const relativePath = `/api/history/images/${folder}/${req.file.filename}`;
    res.json({
      path: relativePath,
      relativePath,
      absolutePath: path.join(req.file.destination, req.file.filename),
      filename: req.file.filename,
      folder
    });
  } catch (error) {
    res.status(500).json({ error: 'Khong the luu anh lich su' });
  }
});

app.post('/api/history/admin/images/rename', requireAuth, async (req, res) => {
  try {
    const { oldPath, newName } = req.body || {};
    if (!oldPath || !newName) {
      return res.status(400).json({ error: 'Thieu oldPath hoac newName' });
    }

    const normalized = normalizeHistoryImagePath(oldPath);
    if (!normalized.startsWith('/api/history/images/')) {
      return res.status(400).json({ error: 'Duong dan anh khong hop le' });
    }

    const relative = normalized.replace('/api/history/images/', '');
    const sourceAbs = path.join(historyImageDir, relative);
    if (!fs.existsSync(sourceAbs)) {
      return res.status(404).json({ error: 'Khong tim thay file can doi ten' });
    }

    const sourceFolder = path.dirname(relative);
    const sourceExt = path.extname(relative);
    const safeBase = String(newName)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'image';
    const targetFile = `${safeBase}${sourceExt}`;
    const targetRel = toUnixPath(path.join(sourceFolder, targetFile));
    const targetAbs = path.join(historyImageDir, targetRel);

    await fs.promises.rename(sourceAbs, targetAbs);
    const newPath = `/api/history/images/${targetRel}`;
    res.json({ oldPath: normalized, newPath, absolutePath: targetAbs });
  } catch (error) {
    res.status(500).json({ error: 'Khong the doi ten file anh' });
  }
});

app.get('/api/history/admin/images/integrity', requireAuth, async (req, res) => {
  try {
    const data = await loadHistoryData();
    const paths = [];
    const collectPaths = (node) => {
      if (Array.isArray(node)) {
        node.forEach(collectPaths);
        return;
      }
      if (!node || typeof node !== 'object') return;
      Object.values(node).forEach((value) => {
        if (typeof value === 'string') {
          const normalized = normalizeHistoryImagePath(value);
          if (normalized.startsWith('/api/history/images/')) paths.push(normalized);
          return;
        }
        collectPaths(value);
      });
    };
    collectPaths(data);

    const uniquePaths = [...new Set(paths)];
    const missing = uniquePaths.filter((urlPath) => {
      const relative = urlPath.replace('/api/history/images/', '');
      return !fs.existsSync(path.join(historyImageDir, relative));
    });

    res.json({
      totalImageRefs: uniquePaths.length,
      missingCount: missing.length,
      missing,
    });
  } catch (error) {
    res.status(500).json({ error: 'Khong the kiem tra image integrity' });
  }
});

app.put('/api/history/admin/data', requireAuth, async (req, res) => {
  try {
    const { detailedData, dynastyData, calendarData } = req.body || {};

    if (!Array.isArray(detailedData) || !Array.isArray(dynastyData) || !Array.isArray(calendarData)) {
      return res.status(400).json({ error: 'Du lieu lich su khong hop le' });
    }

    const normalizedDetailed = normalizeImagePathsDeep(detailedData);
    const normalizedDynasty = normalizeImagePathsDeep(dynastyData);
    const previousData = await loadHistoryData();
    const previousImages = collectImageStrings(previousData);
    const nextImages = collectImageStrings({
      detailedData: normalizedDetailed,
      dynastyData: normalizedDynasty,
    });

    const detailedJson = `${JSON.stringify(normalizedDetailed, null, 2)}\n`;
    const dynastyJson = `${JSON.stringify(normalizedDynasty, null, 2)}\n`;
    const calendarJson = `${JSON.stringify(calendarData, null, 2)}\n`;

    await Promise.all([
      writeFile(path.join(historyDataDir, 'data_detailed.json'), detailedJson, 'utf-8'),
      writeFile(path.join(historyDataDir, 'data_trieudai.json'), dynastyJson, 'utf-8'),
      writeFile(path.join(historyDataDir, 'data_lichnienbieu.json'), calendarJson, 'utf-8')
    ]);

    historyDataCache = { detailedData: normalizedDetailed, dynastyData: normalizedDynasty, calendarData };
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Khong the luu du lieu lich su' });
  }
});

app.post('/api/history/admin/calendar-events', requireAuth, async (req, res) => {
  try {
    const { calendarData, mode = 'overwrite' } = req.body || {};
    if (!Array.isArray(calendarData)) {
      return res.status(400).json({ error: 'calendarData khong hop le' });
    }

    const current = await loadHistoryData();
    const currentCalendar = Array.isArray(current.calendarData) ? current.calendarData : [];
    let nextCalendar = currentCalendar;

    if (mode === 'overwrite') {
      nextCalendar = calendarData;
    } else if (mode === 'merge') {
      const map = new Map();
      currentCalendar.forEach((item, index) => {
        const key = item?.id ? `id:${item.id}` : `idx:${index}`;
        map.set(key, item);
      });
      calendarData.forEach((item, index) => {
        const key = item?.id ? `id:${item.id}` : `idx:${index}`;
        map.set(key, item);
      });
      nextCalendar = [...map.values()];
    } else if (mode === 'update') {
      const incomingById = new Map();
      calendarData.forEach((item) => {
        if (item?.id) incomingById.set(item.id, item);
      });
      nextCalendar = currentCalendar.map((item) => {
        if (item?.id && incomingById.has(item.id)) return incomingById.get(item.id);
        return item;
      });
    } else {
      return res.status(400).json({ error: 'mode khong hop le' });
    }

    const calendarJson = `${JSON.stringify(nextCalendar, null, 2)}\n`;
    await writeFile(path.join(historyDataDir, 'data_lichnienbieu.json'), calendarJson, 'utf-8');

    historyDataCache = {
      detailedData: current.detailedData,
      dynastyData: current.dynastyData,
      calendarData: nextCalendar,
    };

    res.json({ success: true, mode, count: nextCalendar.length });
  } catch (error) {
    res.status(500).json({ error: 'Khong the luu calendar events' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(projectRoot, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  logWithTimezone('SERVER STARTED', {
    port: PORT,
    storage: 'JSON File',
    timezone: 'Asia/Ho_Chi_Minh',
    tokenMasking: 'Enabled'
  });
});
