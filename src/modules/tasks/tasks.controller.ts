// Tasks controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { TasksService } from './tasks.service';
import { successResponse } from '../../utils/response';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  ListTasksQuery,
} from './tasks.types';
import { TaskStatus, PriorityLevel } from '../../types/enums';

export class TasksController {
  private service: TasksService;

  constructor() {
    this.service = new TasksService();
  }

  /**
   * GET /api/tasks
   * List all tasks for the authenticated user's company
   */
  listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListTasksQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        status: req.query.status as TaskStatus,
        priority: req.query.priority as PriorityLevel,
        assignedTo: req.query.assignedTo as string,
        jobId: req.query.jobId as string,
        jobUnitId: req.query.jobUnitId as string,
      };

      const result = await this.service.listTasks(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tasks/:id
   * Get a single task by ID
   */
  getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.id;
      const companyId = req.user!.companyId;

      const task = await this.service.getTaskById(taskId, companyId);
      successResponse(res, task);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/tasks
   * Create a new task
   */
  createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data: CreateTaskRequest = req.body;

      const task = await this.service.createTask(companyId, data);
      successResponse(res, task, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/tasks/:id
   * Update a task
   */
  updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateTaskRequest = req.body;

      const task = await this.service.updateTask(taskId, companyId, data);
      successResponse(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/tasks/:id
   * Delete a task (soft delete)
   */
  deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteTask(taskId, companyId);
      successResponse(res, null, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/tasks/:id/restore
   * Restore a soft-deleted task
   */
  restoreTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.id;
      const companyId = req.user!.companyId;

      const task = await this.service.restoreTask(taskId, companyId);
      successResponse(res, task, 'Task restored successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tasks/statistics
   * Get task statistics by status
   */
  getTaskStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;

      const statistics = await this.service.getTaskStatistics(companyId);
      successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tasks/by-user/:userId
   * Get all tasks assigned to a specific user
   */
  getTasksByUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.params.userId;

      const tasks = await this.service.getTasksByUser(companyId, userId);
      successResponse(res, tasks);
    } catch (error) {
      next(error);
    }
  };
}
