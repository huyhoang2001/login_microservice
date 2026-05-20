import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from './middleware/cors.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { historyRouter } from './modules/history/history.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { captchaRouter } from './modules/captcha/captcha.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cors);
app.use(rateLimiter);

app.use('/api/health', healthRouter);
app.use('/api/captcha', captchaRouter);
app.use('/api/auth', authRouter);
app.use('/api', authRouter);
app.use('/api/history', historyRouter);
app.use('/api/admin', adminRouter);

app.use('/api/history/images', express.static(path.join(__dirname, '../assets/image_history')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.use(errorHandler);

export default app;
