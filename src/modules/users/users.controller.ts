// Users controller - HTTP handlers

import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { successResponse } from '../../utils/response';
import { ListWorkersQuery } from './users.types';

export class UsersController {
  private service: UsersService;

  constructor() {
    this.service = new UsersService();
  }

  /**
   * GET /api/workers
   * List all workers for the company
   */
  listWorkers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListWorkersQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        role: req.query.role as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const result = await this.service.listWorkers(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/workers/:id
   * Get a single worker by ID
   */
  getWorkerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.params.id;
      const companyId = req.user!.companyId;

      const worker = await this.service.getWorkerById(workerId, companyId);
      successResponse(res, worker);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/workers
   * Create a new worker
   */
  createWorker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const worker = await this.service.createWorker(companyId, req.body);
      successResponse(res, worker, 'Worker created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/workers/:id
   * Update a worker
   */
  updateWorker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.params.id;
      const companyId = req.user!.companyId;

      const worker = await this.service.updateWorker(workerId, companyId, req.body);
      successResponse(res, worker, 'Worker updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/workers/:id
   * Delete a worker
   */
  deleteWorker = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteWorker(workerId, companyId);
      successResponse(res, null, 'Worker deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
