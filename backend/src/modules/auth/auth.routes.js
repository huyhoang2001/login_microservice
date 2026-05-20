import { Router } from 'express';
import * as authController from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/signup', authController.signup);
authRouter.get('/profile', authController.profile);
authRouter.post('/logout', authController.logout);
