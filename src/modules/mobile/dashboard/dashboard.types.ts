// Mobile Dashboard Types

export interface DashboardMetrics {
  activeSites: number;
  totalJobsToday: number;
  activeWorkers: number;
  safetyIncidents: number;
  generatedAt: string;
}

export interface DashboardActivityItem {
  id: string;
  type: 'job_created' | 'job_updated' | 'task_completed' | 'safety_incident' | 'worker_assigned';
  description: string;
  date: string;
  timestamp: string;
  metadata?: {
    workerId?: string;
    jobId?: string;
    siteId?: string;
    address?: string;
  };
}

export interface DashboardActivity {
  activities: DashboardActivityItem[];
  generatedAt: string;
}


