// Teams service - Business logic

import { TeamsRepository } from './teams.repository';
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamResponse,
  TeamWithMembersResponse,
  TeamMemberResponse,
  AddTeamMembersRequest,
  UpdateTeamMemberRequest,
  ListTeamsQuery,
} from './teams.types';
import { TeamMemberRole } from '../../types/enums';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../../types/errors';
import { logger } from '../../utils/logger';

export class TeamsService {
  private repository: TeamsRepository;

  constructor() {
    this.repository = new TeamsRepository();
  }

  /**
   * List all teams for a company with pagination and search
   */
  async listTeams(
    companyId: string,
    query: ListTeamsQuery
  ): Promise<{ teams: TeamResponse[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const { teams, total } = await this.repository.findTeamsByCompany(
      companyId,
      query.search,
      limit,
      offset
    );

    // Get member counts if not including full members
    let teamResponses: TeamResponse[];
    
    if (query.includeMembers) {
      // If including members, we'll fetch them in getTeamWithMembers
      teamResponses = await Promise.all(
        teams.map(async (team) => {
          const memberCount = await this.repository.getTeamMemberCount(team.id);
          return this.mapTeamToResponse(team, memberCount);
        })
      );
    } else {
      // Batch fetch member counts for better performance
      const teamIds = teams.map(t => t.id);
      const memberCounts = await this.repository.getTeamMemberCounts(teamIds);
      
      teamResponses = teams.map(team => 
        this.mapTeamToResponse(team, memberCounts.get(team.id) || 0)
      );
    }

    return {
      teams: teamResponses,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single team by ID
   */
  async getTeamById(
    teamId: string,
    companyId: string,
    includeMembers: boolean = false
  ): Promise<TeamResponse | TeamWithMembersResponse> {
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (includeMembers) {
      return await this.getTeamWithMembers(team);
    }

    const memberCount = await this.repository.getTeamMemberCount(teamId);
    return this.mapTeamToResponse(team, memberCount);
  }

  /**
   * Create a new team
   */
  async createTeam(
    companyId: string,
    data: CreateTeamRequest
  ): Promise<TeamWithMembersResponse> {
    // Validate and filter member IDs if provided
    let validUserIds: string[] = [];
    if (data.memberIds && data.memberIds.length > 0) {
      validUserIds = await this.repository.verifyUsersCompany(data.memberIds, companyId);
      
      if (validUserIds.length !== data.memberIds.length) {
        const invalidIds = data.memberIds.filter(id => !validUserIds.includes(id));
        logger.warn(`Invalid user IDs for team creation: ${invalidIds.join(', ')}`);
        throw new BadRequestError(
          `Some user IDs are invalid or do not belong to your company`
        );
      }
    }

    // Create the team
    const team = await this.repository.createTeam(
      companyId,
      data.name,
      data.description
    );

    logger.info(`Team created: ${team.name} (${team.id}) for company ${companyId}`);

    // Add members if provided
    if (validUserIds.length > 0) {
      // Add members with their specified roles or default role
      for (const userId of validUserIds) {
        const role = data.memberRoles?.[userId] || TeamMemberRole.MEMBER;
        await this.repository.addTeamMember(team.id, userId, role);
      }

      logger.info(`Added ${validUserIds.length} members to team ${team.id}`);
    }

    // Return team with members
    return await this.getTeamWithMembers(team);
  }

  /**
   * Update a team
   */
  async updateTeam(
    teamId: string,
    companyId: string,
    data: UpdateTeamRequest
  ): Promise<TeamResponse> {
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const updatedTeam = await this.repository.updateTeam(teamId, companyId, data);
    if (!updatedTeam) {
      throw new NotFoundError('Team not found');
    }

    logger.info(`Team updated: ${updatedTeam.name} (${updatedTeam.id})`);

    const memberCount = await this.repository.getTeamMemberCount(teamId);
    return this.mapTeamToResponse(updatedTeam, memberCount);
  }

  /**
   * Delete a team (soft delete)
   */
  async deleteTeam(teamId: string, companyId: string): Promise<void> {
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Soft delete all team members first
    await this.repository.deleteAllTeamMembers(teamId);

    // Soft delete the team
    const deleted = await this.repository.deleteTeam(teamId, companyId);
    if (!deleted) {
      throw new NotFoundError('Team not found');
    }

    logger.info(`Team deleted: ${team.name} (${teamId})`);
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string, companyId: string): Promise<TeamMemberResponse[]> {
    // Verify team exists and belongs to company
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const members = await this.repository.getTeamMembers(teamId);
    return members.map(this.mapTeamMemberToResponse);
  }

  /**
   * Add members to a team
   */
  async addTeamMembers(
    teamId: string,
    companyId: string,
    data: AddTeamMembersRequest
  ): Promise<TeamMemberResponse[]> {
    // Verify team exists and belongs to company
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Verify all users belong to the same company
    const validUserIds = await this.repository.verifyUsersCompany(data.userIds, companyId);
    
    if (validUserIds.length !== data.userIds.length) {
      const invalidIds = data.userIds.filter(id => !validUserIds.includes(id));
      throw new BadRequestError(
        `Some user IDs are invalid or do not belong to your company: ${invalidIds.join(', ')}`
      );
    }

    // Add members
    await this.repository.addTeamMembers(teamId, validUserIds, data.role);

    logger.info(`Added ${validUserIds.length} members to team ${teamId}`);

    // Return updated member list
    return await this.getTeamMembers(teamId, companyId);
  }

  /**
   * Update team member role
   */
  async updateTeamMember(
    teamId: string,
    companyId: string,
    data: UpdateTeamMemberRequest
  ): Promise<TeamMemberResponse> {
    // Verify team exists and belongs to company
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Verify user belongs to company
    const isValidUser = await this.repository.verifyUserCompany(data.userId, companyId);
    if (!isValidUser) {
      throw new BadRequestError('User does not belong to your company');
    }

    // Check if user is in team
    const isInTeam = await this.repository.isUserInTeam(teamId, data.userId);
    if (!isInTeam) {
      throw new NotFoundError('User is not a member of this team');
    }

    // Update role
    const updatedMember = await this.repository.updateTeamMemberRole(
      teamId,
      data.userId,
      data.role
    );

    if (!updatedMember) {
      throw new NotFoundError('Team member not found');
    }

    logger.info(`Updated role for user ${data.userId} in team ${teamId} to ${data.role}`);

    // Get updated member details
    const members = await this.repository.getTeamMembers(teamId);
    const member = members.find(m => m.user_id === data.userId);
    
    if (!member) {
      throw new NotFoundError('Team member not found');
    }

    return this.mapTeamMemberToResponse(member);
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(
    teamId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    // Verify team exists and belongs to company
    const team = await this.repository.findTeamById(teamId, companyId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if user is in team
    const isInTeam = await this.repository.isUserInTeam(teamId, userId);
    if (!isInTeam) {
      throw new NotFoundError('User is not a member of this team');
    }

    // Remove member
    const removed = await this.repository.removeTeamMember(teamId, userId);
    if (!removed) {
      throw new NotFoundError('Team member not found');
    }

    logger.info(`Removed user ${userId} from team ${teamId}`);
  }

  /**
   * Helper: Get team with members
   */
  private async getTeamWithMembers(team: any): Promise<TeamWithMembersResponse> {
    const members = await this.repository.getTeamMembers(team.id);
    const memberResponses = members.map(this.mapTeamMemberToResponse);

    return {
      id: team.id,
      companyId: team.company_id,
      name: team.name,
      description: team.description,
      memberCount: memberResponses.length,
      members: memberResponses,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    };
  }

  /**
   * Helper: Map team entity to response
   */
  private mapTeamToResponse(team: any, memberCount: number = 0): TeamResponse {
    return {
      id: team.id,
      companyId: team.company_id,
      name: team.name,
      description: team.description,
      memberCount,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    };
  }

  /**
   * Helper: Map team member entity to response
   */
  private mapTeamMemberToResponse(member: any): TeamMemberResponse {
    return {
      id: member.id,
      userId: member.user_id,
      email: member.user_email,
      firstName: member.user_first_name,
      lastName: member.user_last_name,
      userRole: member.user_role,
      teamRole: member.role,
      joinedAt: member.created_at,
    };
  }
}
