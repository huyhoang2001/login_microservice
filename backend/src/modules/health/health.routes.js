import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'OK',
    storage: 'JSON File',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Ho_Chi_Minh',
    server: 'History Backend',
  });
});
