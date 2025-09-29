//backend-service-login\services\captchaService.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CaptchaService {
  constructor() {
    this.sessions = new Map();
    this.puzzleWidth = 60;
    this.puzzleHeight = 60;
    this.canvasWidth = 300;
    this.canvasHeight = 200;
    this.tolerancePercent = { min: 85, max: 99.5 };
  }

  async generateCaptcha() {
    try {
      // Get all available background images (01-36.png)
      const bgImages = [];
      for (let i = 1; i <= 36; i++) {
        const fileName = i.toString().padStart(2, '0') + '.png';
        const filePath = path.join(__dirname, '../assets/image', fileName);
        try {
          await fs.access(filePath);
          bgImages.push(`image/${fileName}`);
        } catch (e) {
          // File doesn't exist, skip
        }
      }
      
      if (bgImages.length === 0) {
        throw new Error('No background images found');
      }
      
      // Get all puzzle shapes (1-4.png)
      const puzzleShapes = [];
      for (let i = 1; i <= 4; i++) {
        const fileName = `${i}.png`;
        const filePath = path.join(__dirname, '../assets/puzzle', fileName);
        try {
          await fs.access(filePath);
          puzzleShapes.push(`puzzle/${fileName}`);
        } catch (e) {
          // File doesn't exist, skip
        }
      }
      
      if (puzzleShapes.length === 0) {
        throw new Error('No puzzle shapes found');
      }
      
      // Random selections
      const bgImage = bgImages[Math.floor(Math.random() * bgImages.length)];
      const puzzleShape = puzzleShapes[Math.floor(Math.random() * puzzleShapes.length)];
      
      console.log(`🎲 Random captcha: bg=${bgImage}, puzzle=${puzzleShape}`);
      
      // Random puzzle position
      const puzzleX = Math.floor(Math.random() * (this.canvasWidth - this.puzzleWidth - 80)) + 40;
      const puzzleY = Math.floor(Math.random() * (this.canvasHeight - this.puzzleHeight - 40)) + 20;
      
      // Generate session
      const sessionId = crypto.randomBytes(16).toString('hex');
      const session = {
        id: sessionId,
        backgroundImage: bgImage,
        puzzleShape: puzzleShape,
        puzzleX,
        puzzleY,
        createdAt: Date.now(),
        attempts: 0
      };
      
      this.sessions.set(sessionId, session);
      
      // Clean old sessions
      this.cleanExpiredSessions();
      
      console.log(`✅ Captcha generated: session=${sessionId}, pos=(${puzzleX}, ${puzzleY})`);
    
    return {
    sessionId,
    backgroundImage: `/api/captcha/image/${sessionId}/background`,
    puzzleImage: `/api/captcha/image/${sessionId}/puzzle`,
    canvasWidth: this.canvasWidth,
    canvasHeight: this.canvasHeight,
    puzzleWidth: this.puzzleWidth,
    puzzleHeight: this.puzzleHeight,
    puzzleX,      // đảm bảo có trả về X
    puzzleY
  };
    
  } catch (error) {
    console.error('❌ Captcha generation error:', error);
    throw error;
  }
  }

  async verifyCaptcha(sessionId, userX, duration) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.log(`❌ Verify failed: session ${sessionId} not found`);
      return { valid: false, reason: 'Session expired' };
    }
    
    // Increment attempts
    session.attempts++;
    
    if (session.attempts > 5) {
      console.log(`❌ Verify failed: too many attempts for session ${sessionId}`);
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'Too many attempts' };
    }
    
    // Check duration (min 0.5s, max 10s)
    if (duration < 500 || duration > 10000) {
      console.log(`❌ Verify failed: invalid duration ${duration}ms`);
      return { valid: false, reason: 'Invalid duration' };
    }
    
    // Calculate accuracy
    const actualX = session.puzzleX;
    const tolerance = 10; // pixels
    const difference = Math.abs(userX - actualX);
    const accuracy = 100 - (difference / this.canvasWidth * 100);
    
    console.log(`🎯 Verification: userX=${userX}, actualX=${actualX}, diff=${difference}, accuracy=${accuracy.toFixed(2)}%`);
    
    if (accuracy >= this.tolerancePercent.min && accuracy <= this.tolerancePercent.max) {
      console.log(`✅ Captcha verified successfully for session ${sessionId}`);
      this.sessions.delete(sessionId); // Success - delete session
      return { valid: true, accuracy };
    }
    
    console.log(`❌ Verify failed: position mismatch (accuracy=${accuracy.toFixed(2)}%)`);
    return { 
      valid: false, 
      reason: 'Position mismatch',
      accuracy 
    };
  }

  async getBackgroundImage(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }
    
    const imagePath = path.join(__dirname, '../assets', session.backgroundImage);
    console.log(`📸 Serving background: ${session.backgroundImage}`);
    return await fs.readFile(imagePath);
  }

  async getPuzzleImage(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }
    
    // Return the selected puzzle shape
    const puzzlePath = path.join(__dirname, '../assets', session.puzzleShape);
    console.log(`🧩 Serving puzzle: ${session.puzzleShape}`);
    return await fs.readFile(puzzlePath);
  }

  cleanExpiredSessions() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    let cleaned = 0;
    
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > timeout) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired captcha sessions`);
    }
  }

  // Debug method to get all sessions
  getActiveSessions() {
    const sessions = [];
    for (const [id, session] of this.sessions) {
      sessions.push({
        id,
        backgroundImage: session.backgroundImage,
        puzzleShape: session.puzzleShape,
        attempts: session.attempts,
        age: Math.floor((Date.now() - session.createdAt) / 1000) + 's'
      });
    }
    return sessions;
  }
}

module.exports = new CaptchaService();