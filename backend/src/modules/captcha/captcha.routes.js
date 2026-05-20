import { Router } from 'express';
import captchaService from '../../../services/captchaService.js';

export const captchaRouter = Router();

captchaRouter.get('/session', async (req, res, next) => {
  try {
    const session = await captchaService.generateCaptcha();
    res.json(session);
  } catch (error) {
    next(error);
  }
});

captchaRouter.get('/image/:sessionId/background', async (req, res) => {
  try {
    const image = await captchaService.getBackgroundImage(req.params.sessionId);
    res.set('Cache-Control', 'private, max-age=300');
    res.type('png').send(image);
  } catch (error) {
    res.status(404).json({ error: 'Captcha background khong ton tai' });
  }
});

captchaRouter.get('/image/:sessionId/puzzle', async (req, res) => {
  try {
    const image = await captchaService.getPuzzleImage(req.params.sessionId);
    res.set('Cache-Control', 'private, max-age=300');
    res.type('png').send(image);
  } catch (error) {
    res.status(404).json({ error: 'Captcha puzzle khong ton tai' });
  }
});

captchaRouter.post('/verify', async (req, res, next) => {
  try {
    const { sessionId, userX, duration, dragHistory } = req.body;

    if (!sessionId || userX == null || duration == null) {
      return res.status(400).json({ error: 'Payload captcha khong hop le' });
    }

    const result = await captchaService.verifyCaptcha(
      sessionId,
      Number(userX),
      Number(duration),
      dragHistory,
    );

    if (!result.valid) {
      return res.status(400).json({ error: result.reason || 'Captcha khong hop le' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});
