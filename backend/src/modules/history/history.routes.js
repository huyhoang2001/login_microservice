import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getAdminData, saveAdminData, saveCalendarEvents } from '../admin/admin.controller.js';
import { getHistory } from './history.controller.js';

export const historyRouter = Router();

historyRouter.get('/admin/data', requireAuth, getAdminData);
historyRouter.put('/admin/data', requireAuth, saveAdminData);
historyRouter.post('/admin/calendar-events', requireAuth, saveCalendarEvents);
historyRouter.get('/', getHistory);
historyRouter.get('/public/data', getHistory);
