// Mobile Safety Controller

import { Request, Response, NextFunction } from 'express';
import { MobileSafetyService } from './safety.service';
import { successResponse } from '../../../utils/response';

export class MobileSafetyController {
  private service: MobileSafetyService;

  constructor() {
    this.service = new MobileSafetyService();
  }

  /**
   * GET /mobile/safety/incidents
   * List safety incidents with filters
   */
  listIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as string,
        severity: req.query.severity as string,
        jobId: req.query.jobId as string,
        siteId: req.query.siteId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const result = await this.service.listIncidents(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/safety/incidents/:id
   * Get safety incident details
   */
  getIncidentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const incidentId = req.params.id;
      const companyId = req.user!.companyId;

      const incident = await this.service.getIncidentById(incidentId, companyId);
      successResponse(res, incident);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /mobile/safety/incidents
   * Create safety incident
   */
  createIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const incident = await this.service.createIncident(companyId, userId, req.body);
      successResponse(res, incident, 'Safety incident created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /mobile/safety/incidents/statistics
   * Get safety statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;

      const stats = await this.service.getStatistics(companyId);
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}




