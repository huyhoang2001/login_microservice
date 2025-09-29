//backend-service-login\server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fileStorage = require('./utils/fileStorage');
const { maskToken, maskSensitiveData, safeLog } = require('./utils/security');
const captchaService = require('./services/captchaService');
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

console.log('🚀 Server starting on port', PORT);

// CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

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
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
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
  const usersCount = await fileStorage.getUsersCount();
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
  const users = await fileStorage.readUsers();
  const safeUsers = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  }));
  
  logWithTimezone('🐛 Debug users requested', { 
    totalUsers: users.length,
    requestedBy: req.headers['x-forwarded-for'] || req.connection.remoteAddress 
  });
  
  res.json({
    total: users.length,
    users: safeUsers,
    storage: 'JSON File'
  });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    logWithTimezone('📝 SIGNUP ATTEMPT', {
      email: email,
      fullName: fullName,
      fromIP: clientIP
    });

    // Validation
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
    const emailInUse = await fileStorage.emailExists(email);
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
    const saved = await fileStorage.addUser(user);
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
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    logWithTimezone('🔐 LOGIN ATTEMPT', {
      email: email,
      fromIP: clientIP
    });

    if (!email?.trim() || !password) {
      logWithTimezone('❌ LOGIN FAILED - Missing credentials', { email: email });
      return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    }

    // Find user in JSON file
    const user = await fileStorage.findUserByEmail(email);
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
    const users = await fileStorage.readUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = user;
      await fileStorage.writeUsers(users);
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
    const token = req.headers.authorization?.replace('Bearer ', '');
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    if (!token) {
      logWithTimezone('❌ PROFILE ACCESS FAILED - No token', { fromIP: clientIP });
      return res.status(401).json({ error: 'Token không tồn tại' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await fileStorage.findUserByEmail(decoded.email);
    
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
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
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
    const token = req.headers.authorization?.replace('Bearer ', '');
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
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
    
    res.json({ message: 'Đăng xuất thành công' });
    
  } catch (error) {
    logWithTimezone('💥 LOGOUT ERROR', {
      error: error.message
    });
    res.status(500).json({ error: 'Lỗi server' });
  }
});
// Add after other requires
// Add captcha endpoints
// Generate new captcha
app.get('/api/captcha/generate', async (req, res) => {
  try {
    const captcha = await captchaService.generateCaptcha();
    res.json(captcha);
  } catch (error) {
    console.error('Captcha generation error:', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
});

// Verify captcha
app.post('/api/captcha/verify', async (req, res) => {
  try {
    const { sessionId, positionX, duration } = req.body;
    const result = await captchaService.verifyCaptcha(sessionId, positionX, duration);
    res.json(result);
  } catch (error) {
    console.error('Captcha verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Serve captcha images
app.get('/api/captcha/image/:sessionId/:type', async (req, res) => {
  try {
    const { sessionId, type } = req.params;
    let imageBuffer;
    
    if (type === 'background') {
      imageBuffer = await captchaService.getBackgroundImage(sessionId);
    } else if (type === 'puzzle') {
      imageBuffer = await captchaService.getPuzzleImage(sessionId);
    } else {
      return res.status(404).json({ error: 'Invalid image type' });
    }
    
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Image serve error:', error);
    res.status(404).json({ error: 'Image not found' });
  }
});
// Start server
app.listen(PORT, () => {
  logWithTimezone('🚀 SERVER STARTED', {
    port: PORT,
    storage: 'JSON File',
    timezone: 'Asia/Ho_Chi_Minh',
    tokenMasking: 'Enabled'
  });
});