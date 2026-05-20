// backend/services/captchaService.js
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CaptchaService {
  constructor() {
    this.sessions = new Map();
    this.puzzleWidth = 60;
    this.puzzleHeight = 60;
    this.canvasWidth = 300;
    this.canvasHeight = 200;
    this.tolerancePercent = { min: 85, max: 99.5 };
    this.assetManifest = null;
  }

  // Helper: collect existing files with numeric suffixes (e.g., 01.png..36.png)
  async _collectIndexedFiles(folderRel, start, end, padWidth = 0) {
    const results = [];
    for (let i = start; i <= end; i++) {
      const name = padWidth ? String(i).padStart(padWidth, '0') : String(i);
      const fileName = `${name}.png`;
      const filePath = path.join(__dirname, '../assets', folderRel, fileName);
      try {
        await fs.access(filePath);
        results.push(`${folderRel}/${fileName}`);
      } catch (e) {
        // skip missing file
      }
    }
    return results;
  }

  _imagePathForSession(session, relPath) {
    return path.join(__dirname, '../assets', relPath);
  }

  async _getAssetManifest() {
    if (!this.assetManifest) {
      const [backgrounds, puzzles] = await Promise.all([
        this._collectIndexedFiles('image', 1, 36, 2),
        this._collectIndexedFiles('puzzle', 1, 4, 0),
      ]);

      this.assetManifest = { backgrounds, puzzles };
    }

    return this.assetManifest;
  }

  async generateCaptcha() {
    try {
      // Collect available background images and puzzle shapes
      const { backgrounds: bgImages, puzzles: puzzleShapes } = await this._getAssetManifest();
      if (bgImages.length === 0) throw new Error('No background images found');

      if (puzzleShapes.length === 0) throw new Error('No puzzle shapes found');

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
      
      console.log(`✅ Captcha generated: session=${sessionId}`);
    
    return {
    sessionId,
    backgroundImage: `/api/captcha/image/${sessionId}/background`,
    puzzleImage: `/api/captcha/image/${sessionId}/puzzle`,
    canvasWidth: this.canvasWidth,
    canvasHeight: this.canvasHeight,
    puzzleWidth: this.puzzleWidth,
    puzzleHeight: this.puzzleHeight,
    puzzleY
  };
    
  } catch (error) {
    console.error('❌ Captcha generation error:', error);
    throw error;
  }
  }

  async verifyCaptcha(sessionId, userX, duration, dragHistory) {
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
    
    // Basic behavioral check: ensure sufficient drag points
    if (!dragHistory || dragHistory < 3) {
      console.log(`❌ Verify failed: insufficient drag history (${dragHistory})`);
      return { valid: false, reason: 'Insufficient drag data' };
    }
    
    // Check position accuracy with tolerance of 2-5 pixels
    const actualX = session.puzzleX;
    const tolerance = 5; // pixels (2-5 pixel tolerance as requested)
    const difference = Math.abs(userX - actualX);
    
    console.log(`🎯 Verification: diff=${difference}px, tolerance=${tolerance}px`);
    
    if (difference <= tolerance) {
      console.log(`✅ Captcha verified successfully for session ${sessionId}`);
      this.sessions.delete(sessionId); // Success - delete session
      return { valid: true, difference };
    }

    console.log(
      `❌ Verify failed: position off by ${difference}px (tolerance ${tolerance}px)`,
    );
    return { valid: false, reason: 'Vị trí mảnh ghép không chính xác' };
  }

  async getBackgroundImage(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }
    const imagePath = this._imagePathForSession(session, session.backgroundImage);
    const puzzlePath = this._imagePathForSession(session, session.puzzleShape);
    console.log(`📸 Serving background: ${session.backgroundImage}`);
    const targetOverlay = await sharp(puzzlePath)
      .resize(this.puzzleWidth, this.puzzleHeight, { fit: 'contain' })
      .ensureAlpha()
      .tint({ r: 0, g: 0, b: 0 })
      .png()
      .toBuffer();

    return await sharp(imagePath)
      .resize(this.canvasWidth, this.canvasHeight, { fit: 'cover' })
      .composite([
        {
          input: targetOverlay,
          left: session.puzzleX,
          top: session.puzzleY,
        },
      ])
      .png()
      .toBuffer();
  }

// backend/services/captchaService.js
// Thay thế hàm getPuzzleImage hiện tại bằng:

// backend/services/captchaService.js (optimized)
// Thay thế hàm getPuzzleImage:

async getPuzzleImage(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const puzzlePath = this._imagePathForSession(session, session.puzzleShape);
      console.log(`🧩 Serving puzzle image: ${session.puzzleShape} -> ${puzzlePath}`);

      const fileBuffer = await fs.readFile(puzzlePath);
      console.log(`✅ Puzzle image loaded (${fileBuffer.length} bytes)`);
      return fileBuffer;
    } catch (error) {
      console.error('❌ Error serving puzzle image:', error.message);
      throw error;
    }
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

export default new CaptchaService();
