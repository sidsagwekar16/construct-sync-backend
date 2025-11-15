// Teams controller - Request handlers

import { Request, Response, NextFunction } from 'express';
import { TeamsService } from './teams.service';
import { successResponse } from '../../utils/response';
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMembersRequest,
  UpdateTeamMemberRequest,
  ListTeamsQuery,
} from './teams.types';

export class TeamsController {
  private service: TeamsService;

  constructor() {
    this.service = new TeamsService();
  }

  /**
   * GET /api/teams
   * List all teams for the authenticated user's company
   */
  listTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query: ListTeamsQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string,
        includeMembers: req.query.includeMembers === 'true',
      };

      const result = await this.service.listTeams(companyId, query);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/teams/:id
   * Get a single team by ID
   */
  getTeamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const companyId = req.user!.companyId;
      const includeMembers = req.query.includeMembers === 'true';

      const team = await this.service.getTeamById(teamId, companyId, includeMembers);
      successResponse(res, team);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/teams
   * Create a new team
   */
  createTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const data: CreateTeamRequest = req.body;

      const team = await this.service.createTeam(companyId, data);
      successResponse(res, team, 'Team created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/teams/:id
   * Update a team
   */
  updateTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateTeamRequest = req.body;

      const team = await this.service.updateTeam(teamId, companyId, data);
      successResponse(res, team, 'Team updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/teams/:id
   * Delete a team (soft delete)
   */
  deleteTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const companyId = req.user!.companyId;

      await this.service.deleteTeam(teamId, companyId);
      successResponse(res, null, 'Team deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/teams/:id/members
   * Get all members of a team
   */
  getTeamMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const companyId = req.user!.companyId;

      const members = await this.service.getTeamMembers(teamId, companyId);
      successResponse(res, members);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/teams/:id/members
   * Add members to a team
   */
  addTeamMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const companyId = req.user!.companyId;
      const data: AddTeamMembersRequest = req.body;

      const members = await this.service.addTeamMembers(teamId, companyId, data);
      successResponse(res, members, 'Members added successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/teams/:id/members
   * Update a team member's role
   */
  updateTeamMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const companyId = req.user!.companyId;
      const data: UpdateTeamMemberRequest = req.body;

      const member = await this.service.updateTeamMember(teamId, companyId, data);
      successResponse(res, member, 'Member role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/teams/:id/members/:userId
   * Remove a member from a team
   */
  removeTeamMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teamId = req.params.id;
      const userId = req.params.userId;
      const companyId = req.user!.companyId;

      await this.service.removeTeamMember(teamId, companyId, userId);
      successResponse(res, null, 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
