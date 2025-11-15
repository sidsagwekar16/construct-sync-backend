// Tasks module types

import { TaskStatus, PriorityLevel } from '../../types/enums';

/**
 * Database schema for job_tasks table
 */
export interface Task {
  id: string;
  job_id: string;
  job_unit_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus | null;
  priority: PriorityLevel | null;
  due_date: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Request body for creating a task
 */
export interface CreateTaskRequest {
  jobId: string;
  title: string;
  description?: string;
  jobUnitId?: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  dueDate?: string;
}

/**
 * Request body for updating a task
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  jobUnitId?: string | null;
  assignedTo?: string | null;
  status?: TaskStatus;
  priority?: PriorityLevel;
  dueDate?: string | null;
}

/**
 * Response object for task
 */
export interface TaskResponse {
  id: string;
  jobId: string;
  jobUnitId: string | null;
  assignedTo: string | null;
  title: string;
  description: string | null;
  status: TaskStatus | null;
  priority: PriorityLevel | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for listing tasks
 */
export interface ListTasksQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  assignedTo?: string;
  jobId?: string;
  jobUnitId?: string;
}
