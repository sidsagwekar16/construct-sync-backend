// Mobile Workers Service

import { db } from '../../../db/connection';
import { logger } from '../../../utils/logger';

export class MobileWorkersService {
  /**
   * Get list of workers for assignment dropdowns
   */
  async listWorkers(companyId: string, role?: string, status?: string): Promise<any[]> {
    try {
      let whereConditions = ['company_id = $1', 'deleted_at IS NULL'];
      const params: any[] = [companyId];
      let paramIndex = 2;

      // Filter by role if specified
      if (role) {
        whereConditions.push(`role = $${paramIndex}`);
        params.push(role);
        paramIndex++;
      } else {
        // Default to worker-related roles
        whereConditions.push(`role IN ('worker', 'foreman', 'site_supervisor')`);
      }

      const whereClause = whereConditions.join(' AND ');

      const result = await db.query(
        `SELECT 
          id,
          first_name || ' ' || last_name as name,
          email,
          phone,
          role
         FROM users
         WHERE ${whereClause}
         ORDER BY first_name, last_name`,
        params
      );

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role: row.role,
        status: 'available', // Default status
        hourlyRate: 0, // Not in current schema
      }));
    } catch (error) {
      logger.error('Error listing workers:', error);
      throw error;
    }
  }
}

