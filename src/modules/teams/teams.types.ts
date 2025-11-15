// Teams module types

import { TeamMemberRole } from '../../types/enums';

/**
 * Database schema for teams table
 */
export interface Team {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Database schema for team_members table
 */
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole | null;
  deleted_at: Date | null;
  created_at: Date;
}

/**
 * Extended team member with user details
 */
export interface TeamMemberWithUser extends TeamMember {
  user_email: string;
  user_first_name: string | null;
  user_last_name: string | null;
  user_role: string;
}

/**
 * Request body for creating a team
 */
export interface CreateTeamRequest {
  name: string;
  description?: string;
  memberIds?: string[]; // User IDs to add as members
  memberRoles?: { [userId: string]: TeamMemberRole }; // Optional role mapping
}

/**
 * Request body for updating a team
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

/**
 * Request body for adding team members
 */
export interface AddTeamMembersRequest {
  userIds: string[];
  role?: TeamMemberRole; // Default role for all added members
}

/**
 * Request body for updating team member role
 */
export interface UpdateTeamMemberRequest {
  userId: string;
  role: TeamMemberRole;
}

/**
 * Response object for team
 */
export interface TeamResponse {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response object for team with members
 */
export interface TeamWithMembersResponse extends TeamResponse {
  members: TeamMemberResponse[];
}

/**
 * Response object for team member
 */
export interface TeamMemberResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userRole: string;
  teamRole: TeamMemberRole | null;
  joinedAt: Date;
}

/**
 * Query parameters for listing teams
 */
export interface ListTeamsQuery {
  page?: number;
  limit?: number;
  search?: string;
  includeMembers?: boolean;
}
