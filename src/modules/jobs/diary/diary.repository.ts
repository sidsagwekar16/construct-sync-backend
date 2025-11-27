// Job diary repository - Database operations

import { db } from '../../../db/connection';
import { JobDiary, CreateDiaryRequest } from './diary.types';

export class DiaryRepository {
  /**
   * Create a new diary entry for a job
   */
  async createDiaryEntry(
    jobId: string,
    createdBy: string,
    data: CreateDiaryRequest
  ): Promise<JobDiary> {
    const query = `
      INSERT INTO job_diaries (job_id, content, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
      RETURNING 
        id,
        job_id as "jobId",
        content,
        created_by as "createdBy",
        created_at AT TIME ZONE 'UTC' as "createdAt",
        updated_at AT TIME ZONE 'UTC' as "updatedAt"
    `;

    const result = await db.query(query, [jobId, data.content, createdBy]);
    return result.rows[0];
  }

  /**
   * Get all diary entries for a job
   */
  async getDiaryEntriesByJobId(jobId: string): Promise<JobDiary[]> {
    const query = `
      SELECT 
        jd.id,
        jd.job_id as "jobId",
        jd.content,
        jd.created_by as "createdBy",
        jd.created_at AT TIME ZONE 'UTC' as "createdAt",
        jd.updated_at AT TIME ZONE 'UTC' as "updatedAt",
        json_build_object(
          'id', u.id,
          'name', CONCAT(u.first_name, ' ', u.last_name),
          'email', u.email
        ) as "createdByUser"
      FROM job_diaries jd
      LEFT JOIN users u ON jd.created_by = u.id
      WHERE jd.job_id = $1
      ORDER BY jd.created_at DESC
    `;

    const result = await db.query(query, [jobId]);
    return result.rows;
  }

  /**
   * Delete a diary entry by ID
   */
  async deleteDiaryEntry(diaryId: string, jobId: string): Promise<boolean> {
    const query = `
      DELETE FROM job_diaries
      WHERE id = $1 AND job_id = $2
      RETURNING id
    `;

    const result = await db.query(query, [diaryId, jobId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get a single diary entry by ID
   */
  async getDiaryEntryById(diaryId: string, jobId: string): Promise<JobDiary | null> {
    const query = `
      SELECT 
        jd.id,
        jd.job_id as "jobId",
        jd.content,
        jd.created_by as "createdBy",
        jd.created_at AT TIME ZONE 'UTC' as "createdAt",
        jd.updated_at AT TIME ZONE 'UTC' as "updatedAt",
        json_build_object(
          'id', u.id,
          'name', CONCAT(u.first_name, ' ', u.last_name),
          'email', u.email
        ) as "createdByUser"
      FROM job_diaries jd
      LEFT JOIN users u ON jd.created_by = u.id
      WHERE jd.id = $1 AND jd.job_id = $2
    `;

    const result = await db.query(query, [diaryId, jobId]);
    return result.rows[0] || null;
  }
}
