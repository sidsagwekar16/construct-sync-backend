// Settings Routes - Company-wide settings management

import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

// Get company settings
router.get('/', authenticateToken, controller.getSettings);

// Update company settings
router.patch('/', authenticateToken, controller.updateSettings);

export default router;
