// Tasks service - Business logic

import { TasksRepository } from './tasks.repository';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskResponse,
  ListTasksQuery,
} from './tasks.types';
import { TaskStatus, PriorityLevel } from '../../types/enums';
import {
  NotFoundError,
  BadRequestError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class TasksService {
  private repository: TasksRepository;

  constructor() {
    this.repository = new TasksRepository();
  }

  /**
   * List all tasks for a company with pagination and filtering
   */
  async listTasks(
    companyId: string,
    query: ListTasksQuery
  ): Promise<{ tasks: TaskResponse[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { tasks, total } = await this.repository.findTasksByCompany(
      companyId,
      query.search,
      query.status,
      query.priority,
      query.assignedTo,
      query.jobId,
      query.jobUnitId,
      limit,
      offset
    );

    const taskResponses = tasks.map(this.mapTaskToResponse);

    return {
      tasks: taskResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(
    taskId: string,
    companyId: string
  ): Promise<TaskResponse> {
    const task = await this.repository.findTaskById(taskId, companyId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return this.mapTaskToResponse(task);
  }

  /**
   * Create a new task
   */
  async createTask(
    companyId: string,
    data: CreateTaskRequest
  ): Promise<TaskResponse> {
    // Validate job exists and belongs to company
    const jobExists = await this.repository.verifyJobCompany(data.jobId, companyId);
    if (!jobExists) {
      throw new BadRequestError('Job does not exist or does not belong to your company');
    }

    // Validate job unit if provided
    if (data.jobUnitId) {
      const jobUnitExists = await this.repository.verifyJobUnitCompany(
        data.jobUnitId,
        data.jobId,
        companyId
      );
      if (!jobUnitExists) {
        throw new BadRequestError('Job unit does not exist or does not belong to this job');
      }
    }

    // Validate assigned user if provided
    if (data.assignedTo) {
      const userExists = await this.repository.verifyUserCompany(data.assignedTo, companyId);
      if (!userExists) {
        throw new BadRequestError('Assigned user does not exist or does not belong to your company');
      }
    }

    const task = await this.repository.createTask(
      data.jobId,
      data.title,
      data.description,
      data.jobUnitId,
      data.assignedTo,
      data.status,
      data.priority,
      data.dueDate ? new Date(data.dueDate) : undefined
    );

    logger.info(`Task created: ${task.title} (${task.id}) for job ${data.jobId}`);

    return this.mapTaskToResponse(task);
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    companyId: string,
    data: UpdateTaskRequest
  ): Promise<TaskResponse> {
    const task = await this.repository.findTaskById(taskId, companyId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Validate job unit if being updated
    if (data.jobUnitId !== undefined && data.jobUnitId !== null) {
      const jobUnitExists = await this.repository.verifyJobUnitCompany(
        data.jobUnitId,
        task.job_id,
        companyId
      );
      if (!jobUnitExists) {
        throw new BadRequestError('Job unit does not exist or does not belong to this job');
      }
    }

    // Validate assigned user if being updated
    if (data.assignedTo !== undefined && data.assignedTo !== null) {
      const userExists = await this.repository.verifyUserCompany(data.assignedTo, companyId);
      if (!userExists) {
        throw new BadRequestError('Assigned user does not exist or does not belong to your company');
      }
    }

    const updatedTask = await this.repository.updateTask(taskId, companyId, {
      title: data.title,
      description: data.description,
      jobUnitId: data.jobUnitId,
      assignedTo: data.assignedTo,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate !== undefined 
        ? (data.dueDate ? new Date(data.dueDate) : null) 
        : undefined,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found');
    }

    logger.info(`Task updated: ${updatedTask.title} (${updatedTask.id})`);

    return this.mapTaskToResponse(updatedTask);
  }

  /**
   * Delete a task (soft delete)
   */
  async deleteTask(taskId: string, companyId: string): Promise<void> {
    const task = await this.repository.findTaskById(taskId, companyId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const deleted = await this.repository.deleteTask(taskId, companyId);
    if (!deleted) {
      throw new NotFoundError('Task not found');
    }

    logger.info(`Task deleted: ${task.title} (${taskId})`);
  }

  /**
   * Restore a soft-deleted task
   */
  async restoreTask(taskId: string, companyId: string): Promise<TaskResponse> {
    const restoredTask = await this.repository.restoreTask(taskId, companyId);
    if (!restoredTask) {
      throw new NotFoundError('Task not found or already active');
    }

    logger.info(`Task restored: ${restoredTask.title} (${taskId})`);

    return this.mapTaskToResponse(restoredTask);
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(
    companyId: string,
    status: TaskStatus
  ): Promise<TaskResponse[]> {
    const tasks = await this.repository.getTasksByStatus(companyId, status);
    return tasks.map(this.mapTaskToResponse);
  }

  /**
   * Get task statistics by status
   */
  async getTaskStatistics(companyId: string): Promise<{
    total: number;
    byStatus: { [key in TaskStatus]?: number };
  }> {
    const statusCounts = await this.repository.countTasksByStatus(companyId);

    const byStatus: { [key in TaskStatus]?: number } = {};
    let total = 0;

    statusCounts.forEach((count, status) => {
      byStatus[status] = count;
      total += count;
    });

    return { total, byStatus };
  }

  /**
   * Get tasks assigned to a specific user
   */
  async getTasksByUser(
    companyId: string,
    userId: string
  ): Promise<TaskResponse[]> {
    // Verify user exists and belongs to company
    const userExists = await this.repository.verifyUserCompany(userId, companyId);
    if (!userExists) {
      throw new NotFoundError('User not found');
    }

    const tasks = await this.repository.getTasksByUser(companyId, userId);
    return tasks.map(this.mapTaskToResponse);
  }

  /**
   * Helper: Map task entity to response
   */
  private mapTaskToResponse(task: any): TaskResponse {
    return {
      id: task.id,
      jobId: task.job_id,
      jobUnitId: task.job_unit_id,
      assignedTo: task.assigned_to,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  }
}
