// Mobile Dashboard Service

import { db } from '../../../db/connection';
import { DashboardMetrics, DashboardActivity, DashboardActivityItem } from './dashboard.types';
import { logger } from '../../../utils/logger';

export class MobileDashboardService {
  /**
   * Get dashboard metrics aggregated from multiple tables
   */
  async getMetrics(companyId: string): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Get active sites count
      const sitesResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM sites 
         WHERE company_id = $1 
         AND deleted_at IS NULL 
         AND status = 'active'`,
        [companyId]
      );

      // Get jobs today count
      const jobsResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM jobs 
         WHERE company_id = $1 
         AND deleted_at IS NULL 
         AND (start_date >= $2 AND start_date < $3)`,
        [companyId, todayStart, todayEnd]
      );

      // Get active workers count (users with role worker who are not deleted)
      const workersResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE company_id = $1 
         AND deleted_at IS NULL 
         AND role IN ('worker', 'foreman', 'site_supervisor')`,
        [companyId]
      );

      // Get open safety incidents count
      const safetyResult = await db.query(
        `SELECT COUNT(*) as count 
         FROM safety_incidents si
         JOIN jobs j ON si.job_id = j.id
         WHERE j.company_id = $1 
         AND si.deleted_at IS NULL 
         AND si.status IN ('open', 'investigating')`,
        [companyId]
      );

      return {
        activeSites: parseInt(sitesResult.rows[0].count, 10),
        totalJobsToday: parseInt(jobsResult.rows[0].count, 10),
        activeWorkers: parseInt(workersResult.rows[0].count, 10),
        safetyIncidents: parseInt(safetyResult.rows[0].count, 10),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get recent activity feed from multiple sources
   */
  async getActivity(companyId: string, limit: number = 20): Promise<DashboardActivity> {
    try {
      const activities: DashboardActivityItem[] = [];

      // Get recent job activities
      const jobsResult = await db.query(
        `SELECT 
          j.id,
          j.name,
          j.created_at,
          j.updated_at,
          s.address,
          u.first_name || ' ' || u.last_name as created_by_name
         FROM jobs j
         LEFT JOIN sites s ON j.site_id = s.id
         LEFT JOIN users u ON j.created_by = u.id
         WHERE j.company_id = $1 
         AND j.deleted_at IS NULL
         ORDER BY j.created_at DESC
         LIMIT $2`,
        [companyId, Math.floor(limit / 2)]
      );

      jobsResult.rows.forEach((job: any) => {
        activities.push({
          id: `job-${job.id}`,
          type: 'job_created',
          description: `New job created: ${job.name}`,
          date: new Date(job.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          timestamp: job.created_at,
          metadata: {
            jobId: job.id,
            address: job.address,
          },
        });
      });

      // Get recent task completions
      const tasksResult = await db.query(
        `SELECT 
          t.id,
          t.title as name,
          t.updated_at,
          j.id as job_id,
          j.name as job_name,
          u.first_name || ' ' || u.last_name as assigned_to_name
         FROM job_tasks t
         JOIN jobs j ON t.job_id = j.id
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE j.company_id = $1 
         AND t.deleted_at IS NULL
         AND t.status = 'completed'
         ORDER BY t.updated_at DESC
         LIMIT $2`,
        [companyId, Math.floor(limit / 4)]
      );

      tasksResult.rows.forEach((task: any) => {
        activities.push({
          id: `task-${task.id}`,
          type: 'task_completed',
          description: `Task completed: ${task.name}`,
          date: new Date(task.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          timestamp: task.updated_at,
          metadata: {
            jobId: task.job_id,
          },
        });
      });

      // Get recent safety incidents
      const safetyResult = await db.query(
        `SELECT 
          si.id,
          si.description,
          si.created_at,
          si.severity,
          j.id as job_id,
          j.name as job_name,
          s.address
         FROM safety_incidents si
         JOIN jobs j ON si.job_id = j.id
         LEFT JOIN sites s ON si.site_id = s.id
         WHERE j.company_id = $1 
         AND si.deleted_at IS NULL
         ORDER BY si.created_at DESC
         LIMIT $2`,
        [companyId, Math.floor(limit / 4)]
      );

      safetyResult.rows.forEach((incident: any) => {
        activities.push({
          id: `incident-${incident.id}`,
          type: 'safety_incident',
          description: `Safety incident reported: ${incident.description.substring(0, 50)}...`,
          date: new Date(incident.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          timestamp: incident.created_at,
          metadata: {
            jobId: incident.job_id,
            address: incident.address,
          },
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return {
        activities: activities.slice(0, limit),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching dashboard activity:', error);
      throw error;
    }
  }
}

