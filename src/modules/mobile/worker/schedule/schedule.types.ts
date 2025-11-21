// Worker Schedule Module Types

import { JobStatus, PriorityLevel } from '../../../../types/enums';

/**
 * Worker schedule job entry
 */
export interface WorkerScheduleJob {
  id: string;
  name: string;
  jobType: string | null;
  status: JobStatus | null;
  priority: PriorityLevel | null;
  startDate: Date | null;
  endDate: Date | null;
  siteId: string | null;
  siteName: string | null;
  siteAddress: string | null;
}

/**
 * Query parameters for schedule
 */
export interface GetWorkerScheduleQuery {
  startDate?: string;
  endDate?: string;
}

