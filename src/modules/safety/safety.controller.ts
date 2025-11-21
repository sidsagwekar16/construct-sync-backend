// Safety controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { SafetyService } from './safety.service';
import { successResponse } from '../../utils/response';
import {
  CreateSafetyIncidentRequest,
  UpdateSafetyIncidentRequest,
  ListSafetyIncidentsQuery,
} from './safety.types';
import { SafetyStatus, SeverityLevel } from '../../types/enums';

export class SafetyController {
  private service: SafetyService;

  constructor() {
    this.service = new SafetyService();
  }

  /**
   * GET /api/safety/incidents
   * List all safety incidents for the authenticated user's company
   */
  listIncidents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListSafetyIncidentsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        status: req.query.status as SafetyStatus,
        severity: req.query.severity as SeverityLevel,
        jobId: req.query.jobId as string,
        siteId: req.query.siteId as string,
        reportedBy: req.query.reportedBy as string,
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
   * GET /api/safety/incidents/:id
   * Get a single safety incident by ID
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
   * POST /api/safety/incidents
   * Create a new safety incident
   */
  createIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const reportedBy = req.user!.id;
      const data: CreateSafetyIncidentRequest = req.body;

      const incident = await this.service.createIncident(companyId, reportedBy, data);
      successResponse(res, incident, 'Safety incident created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/safety/incidents/:id
   * Update a safety incident
   */
  updateIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const incidentId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateSafetyIncidentRequest = req.body;

      const incident = await this.service.updateIncident(incidentId, companyId, data);
      successResponse(res, incident, 'Safety incident updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/safety/incidents/:id
   * Delete a safety incident (soft delete)
   */
  deleteIncident = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const incidentId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteIncident(incidentId, companyId);
      successResponse(res, null, 'Safety incident deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/safety/incidents/statistics
   * Get statistics about safety incidents
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;

      const statistics = await this.service.getIncidentStatistics(companyId);
      successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  };
}
