// Check-ins repository - Database operations

import { db } from '../../db/connection';
import { CheckInLog } from './check-ins.types';

export class CheckInsRepository {
  /**
   * Create a new check-in log
   */
  async createCheckIn(
    userId: string,
    jobId: string,
    hourlyRate: number | null,
    notes?: string
  ): Promise<CheckInLog> {
    const query = `
      INSERT INTO check_in_logs (user_id, job_id, hourly_rate, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query<CheckInLog>(query, [userId, jobId, hourlyRate, notes || null]);
    return result.rows[0];
  }

  /**
   * Update check-out time and calculate duration/billable amount
   */
  async checkOut(
    checkInLogId: string,
    userId: string,
    notes?: string
  ): Promise<CheckInLog | null> {
    const query = `
      UPDATE check_in_logs
      SET 
        check_out_time = CURRENT_TIMESTAMP,
        duration_hours = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)) / 3600, 2),
        billable_amount = ROUND(
          (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)) / 3600) * COALESCE(hourly_rate, 0), 
          2
        ),
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND check_out_time IS NULL AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await db.query<CheckInLog>(query, [checkInLogId, userId, notes || null]);
    return result.rows[0] || null;
  }

  /**
   * Find active check-in for a user (not checked out yet)
   */
  async findActiveCheckIn(userId: string): Promise<CheckInLog | null> {
    const query = `
      SELECT * FROM check_in_logs
      WHERE user_id = $1 AND check_out_time IS NULL AND deleted_at IS NULL
      ORDER BY check_in_time DESC
      LIMIT 1
    `;
    const result = await db.query<CheckInLog>(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find active check-in for a user on a specific job
   */
  async findActiveCheckInForJob(userId: string, jobId: string): Promise<CheckInLog | null> {
    const query = `
      SELECT * FROM check_in_logs
      WHERE user_id = $1 AND job_id = $2 AND check_out_time IS NULL AND deleted_at IS NULL
      ORDER BY check_in_time DESC
      LIMIT 1
    `;
    const result = await db.query<CheckInLog>(query, [userId, jobId]);
    return result.rows[0] || null;
  }

  /**
   * Find check-in log by ID
   */
  async findCheckInById(checkInLogId: string, userId: string): Promise<CheckInLog | null> {
    const query = `
      SELECT * FROM check_in_logs
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<CheckInLog>(query, [checkInLogId, userId]);
    return result.rows[0] || null;
  }

  /**
   * List check-in logs with filters and pagination
   */
  async listCheckInLogs(
    companyId: string,
    userId?: string,
    jobId?: string,
    startDate?: Date,
    endDate?: Date,
    activeOnly?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: CheckInLog[]; total: number }> {
    let query = `
      SELECT cil.* 
      FROM check_in_logs cil
      INNER JOIN users u ON cil.user_id = u.id
      WHERE u.company_id = $1 AND cil.deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Filter by user
    if (userId) {
      query += ` AND cil.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Filter by job
    if (jobId) {
      query += ` AND cil.job_id = $${paramIndex}`;
      params.push(jobId);
      paramIndex++;
    }

    // Filter by date range
    if (startDate) {
      query += ` AND cil.check_in_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND cil.check_in_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Filter active only (not checked out)
    if (activeOnly) {
      query += ` AND cil.check_out_time IS NULL`;
    }

    // Get total count
    const countQuery = query.replace('SELECT cil.*', 'SELECT COUNT(*)');
    const countResult = await db.query<{ count: string }>(countQuery, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].count, 10);

    // Add ordering and pagination
    query += ` ORDER BY cil.check_in_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<CheckInLog>(query, params);
    return { logs: result.rows, total };
  }

  /**
   * Get check-in logs for a specific user
   */
  async getUserCheckInHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: CheckInLog[]; total: number }> {
    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM check_in_logs
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const countResult = await db.query<{ count: string }>(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get logs
    const query = `
      SELECT * FROM check_in_logs
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY check_in_time DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query<CheckInLog>(query, [userId, limit, offset]);
    return { logs: result.rows, total };
  }

  /**
   * Get total billable hours for a user in a date range
   */
  async getTotalBillableHours(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalHours: number; totalAmount: number }> {
    const query = `
      SELECT 
        COALESCE(SUM(duration_hours), 0) as total_hours,
        COALESCE(SUM(billable_amount), 0) as total_amount
      FROM check_in_logs
      WHERE user_id = $1 
        AND check_in_time >= $2 
        AND check_in_time <= $3
        AND check_out_time IS NOT NULL
        AND deleted_at IS NULL
    `;
    const result = await db.query<{ total_hours: string; total_amount: string }>(
      query, 
      [userId, startDate, endDate]
    );
    return {
      totalHours: parseFloat(result.rows[0]?.total_hours || '0'),
      totalAmount: parseFloat(result.rows[0]?.total_amount || '0'),
    };
  }

  /**
   * Soft delete a check-in log
   */
  async deleteCheckIn(checkInLogId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE check_in_logs
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [checkInLogId, userId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
