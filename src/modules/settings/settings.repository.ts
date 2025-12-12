// Settings Repository

import { db } from '../../db/connection';

export class SettingsRepository {
  async getSettings(companyId: string): Promise<any> {
    const query = `
      SELECT settings 
      FROM company_settings 
      WHERE company_id = $1
    `;
    
    const result = await db.query(query, [companyId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].settings;
  }

  async updateSettings(companyId: string, settings: any): Promise<any> {
    const query = `
      INSERT INTO company_settings (company_id, settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (company_id) 
      DO UPDATE SET 
        settings = $2,
        updated_at = NOW()
      RETURNING settings
    `;
    
    const result = await db.query(query, [companyId, JSON.stringify(settings)]);
    
    return result.rows[0].settings;
  }
}
