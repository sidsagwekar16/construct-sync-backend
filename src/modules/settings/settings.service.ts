// Settings Service

import { SettingsRepository } from './settings.repository';
import { logger } from '../../utils/logger';

export class SettingsService {
  private repository: SettingsRepository;

  constructor() {
    this.repository = new SettingsRepository();
  }

  async getSettings(companyId: string): Promise<any> {
    const settings = await this.repository.getSettings(companyId);
    return settings || {};
  }

  async updateSettings(companyId: string, newSettings: any): Promise<any> {
    // Get existing settings
    const existing = await this.repository.getSettings(companyId);
    
    // Merge with new settings
    const merged = {
      ...(existing || {}),
      ...newSettings,
    };

    // Update in database
    const updated = await this.repository.updateSettings(companyId, merged);
    
    logger.info(`Settings updated for company ${companyId}`);
    
    return updated;
  }
}
