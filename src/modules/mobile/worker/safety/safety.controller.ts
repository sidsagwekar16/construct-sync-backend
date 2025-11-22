// Worker Safety Controller

import { Request, Response, NextFunction } from 'express';
import { WorkerSafetyService } from './safety.service';
import { successResponse } from '../../../../utils/response';
import {
  ListWorkerSafetyIncidentsQuery,
  CreateWorkerSafetyIncidentRequest,
} from './safety.types';
import { SeverityLevel, SafetyStatus } from '../../../../types/enums';

export class WorkerSafetyController {
  private service: WorkerSafetyService;

  constructor() {
    this.service = new WorkerSafetyService();
  }

  /**
   * GET /mobile/worker/safety/incidents
   * List incidents reported by worker
   */
  listIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;

      const query: ListWorkerSafetyIncidentsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        severity: req.query.severity as SeverityLevel,
        status: req.query.status as SafetyStatus,
        jobId: req.query.jobId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await this.service.listWorkerIncidents(workerId, companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/safety/incidents/:id
   * Get incident details
   */
  getIncidentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const incidentId = req.params.id;
      const workerId = req.user!.id;

      const incident = await this.service.getWorkerIncidentById(incidentId, workerId);
      successResponse(res, incident);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /mobile/worker/safety/incidents
   * Report new incident
   */
  createIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;
      const companyId = req.user!.companyId;
      const data: CreateWorkerSafetyIncidentRequest = req.body;

      const incident = await this.service.createIncident(workerId, companyId, data);
      successResponse(res, incident, 'Safety incident reported successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/worker/safety/incidents/statistics
   * Get worker's safety statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workerId = req.user!.id;

      const stats = await this.service.getWorkerStatistics(workerId);
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}



