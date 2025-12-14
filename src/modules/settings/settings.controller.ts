// Settings Controller

import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service.js';
import { logger } from '../../utils/logger';

export class SettingsController {
  private service: SettingsService;

  constructor() {
    this.service = new SettingsService();
  }

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const settings = await this.service.getSettings(companyId);
      res.json({ settings });
    } catch (error) {
      logger.error('Error getting settings:', error);
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const settings = await this.service.updateSettings(companyId, req.body);
      res.json({ settings, message: 'Settings updated successfully' });
    } catch (error) {
      logger.error('Error updating settings:', error);
      next(error);
    }
  };
}
