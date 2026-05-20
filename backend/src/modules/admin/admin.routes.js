import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getAdminData } from './admin.controller.js';

export const adminRouter = Router();

adminRouter.get('/', requireAuth, getAdminData);
