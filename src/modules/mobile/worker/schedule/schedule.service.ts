// Worker Schedule Service

import { db } from '../../../../db/connection';
import { WorkerScheduleJob, GetWorkerScheduleQuery } from './schedule.types';

export class WorkerScheduleService {
  /**
   * Get worker's schedule (assigned jobs with dates)
   */
  async getWorkerSchedule(
    workerId: string,
    companyId: string,
    query: GetWorkerScheduleQuery
  ): Promise<WorkerScheduleJob[]> {
    let whereConditions = [
      'jw.user_id = $1',
      'j.company_id = $2',
      'j.deleted_at IS NULL',
      'j.start_date IS NOT NULL',
    ];
    const params: any[] = [workerId, companyId];
    let paramIndex = 3;

    if (query.startDate) {
      whereConditions.push(`j.start_date >= $${paramIndex}`);
      params.push(query.startDate);
      paramIndex++;
    }

    if (query.endDate) {
      whereConditions.push(`j.start_date <= $${paramIndex}`);
      params.push(query.endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const scheduleQuery = `
      SELECT DISTINCT
        j.id,
        j.name,
        j.job_type,
        j.status,
        j.priority,
        j.start_date,
        j.end_date,
        j.site_id,
        s.name as site_name,
        s.address as site_address
      FROM jobs j
      INNER JOIN job_workers jw ON jw.job_id = j.id
      LEFT JOIN sites s ON s.id = j.site_id
      WHERE ${whereClause}
      ORDER BY j.start_date ASC, j.name ASC
    `;

    const result = await db.query(scheduleQuery, params);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      jobType: row.job_type,
      status: row.status,
      priority: row.priority,
      startDate: row.start_date,
      endDate: row.end_date,
      siteId: row.site_id,
      siteName: row.site_name,
      siteAddress: row.site_address,
    }));
  }

  /**
   * Get today's jobs for worker
   */
  async getTodaysJobs(workerId: string, companyId: string): Promise<WorkerScheduleJob[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getWorkerSchedule(workerId, companyId, {
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
    });
  }

  /**
   * Get this week's jobs for worker
   */
  async getWeeksJobs(workerId: string, companyId: string): Promise<WorkerScheduleJob[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.getWorkerSchedule(workerId, companyId, {
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString(),
    });
  }
}

