// Teams repository - Database operations

import { db } from '../../db/connection';
import { Team, TeamMember, TeamMemberWithUser } from './teams.types';
import { TeamMemberRole } from '../../types/enums';

export class TeamsRepository {
  /**
   * Find all teams for a company with optional search and pagination
   * Excludes soft-deleted teams
   */
  async findTeamsByCompany(
    companyId: string,
    search?: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ teams: Team[]; total: number }> {
    let query = `
      SELECT * FROM teams 
      WHERE company_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [companyId];
    let paramIndex = 2;

    // Add search filter if provided
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await db.query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query<Team>(query, params);
    return { teams: result.rows, total };
  }

  /**
   * Find a team by ID
   * Only returns if not soft-deleted and belongs to the company
   */
  async findTeamById(teamId: string, companyId: string): Promise<Team | null> {
    const query = `
      SELECT * FROM teams 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<Team>(query, [teamId, companyId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new team
   */
  async createTeam(
    companyId: string,
    name: string,
    description?: string | null
  ): Promise<Team> {
    const query = `
      INSERT INTO teams (company_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await db.query<Team>(query, [companyId, name, description]);
    return result.rows[0];
  }

  /**
   * Update a team
   */
  async updateTeam(
    teamId: string,
    companyId: string,
    data: { name?: string; description?: string | null }
  ): Promise<Team | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findTeamById(teamId, companyId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE teams 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *
    `;
    params.push(teamId, companyId);

    const result = await db.query<Team>(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a team
   */
  async deleteTeam(teamId: string, companyId: string): Promise<boolean> {
    const query = `
      UPDATE teams 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [teamId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Get member count for a team
   */
  async getTeamMemberCount(teamId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM team_members 
      WHERE team_id = $1 AND deleted_at IS NULL
    `;
    const result = await db.query<{ count: string }>(query, [teamId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get member counts for multiple teams
   */
  async getTeamMemberCounts(teamIds: string[]): Promise<Map<string, number>> {
    if (teamIds.length === 0) return new Map();

    const query = `
      SELECT team_id, COUNT(*) as count 
      FROM team_members 
      WHERE team_id = ANY($1) AND deleted_at IS NULL
      GROUP BY team_id
    `;
    const result = await db.query<{ team_id: string; count: string }>(query, [teamIds]);

    const counts = new Map<string, number>();
    result.rows.forEach((row) => {
      counts.set(row.team_id, parseInt(row.count, 10));
    });

    return counts;
  }

  /**
   * Get team members with user details
   */
  async getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
    const query = `
      SELECT 
        tm.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.role as user_role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1 AND tm.deleted_at IS NULL AND u.deleted_at IS NULL
      ORDER BY tm.created_at ASC
    `;
    const result = await db.query<TeamMemberWithUser>(query, [teamId]);
    return result.rows;
  }

  /**
   * Check if a user is a member of a team
   */
  async isUserInTeam(teamId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT id FROM team_members 
      WHERE team_id = $1 AND user_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [teamId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Add a member to a team
   */
  async addTeamMember(
    teamId: string,
    userId: string,
    role: TeamMemberRole = TeamMemberRole.MEMBER
  ): Promise<TeamMember> {
    const query = `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (team_id, user_id) 
      DO UPDATE SET deleted_at = NULL, role = $3
      RETURNING *
    `;
    const result = await db.query<TeamMember>(query, [teamId, userId, role]);
    return result.rows[0];
  }

  /**
   * Add multiple members to a team
   */
  async addTeamMembers(
    teamId: string,
    userIds: string[],
    role: TeamMemberRole = TeamMemberRole.MEMBER
  ): Promise<TeamMember[]> {
    if (userIds.length === 0) return [];

    // Build VALUES clause for bulk insert
    const values = userIds.map((_, i) => {
      const offset = i * 3;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    }).join(', ');

    const params: any[] = [];
    userIds.forEach(userId => {
      params.push(teamId, userId, role);
    });

    const query = `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ${values}
      ON CONFLICT (team_id, user_id) 
      DO UPDATE SET deleted_at = NULL, role = EXCLUDED.role
      RETURNING *
    `;

    const result = await db.query<TeamMember>(query, params);
    return result.rows;
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    teamId: string,
    userId: string,
    role: TeamMemberRole
  ): Promise<TeamMember | null> {
    const query = `
      UPDATE team_members 
      SET role = $1
      WHERE team_id = $2 AND user_id = $3 AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await db.query<TeamMember>(query, [role, teamId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Remove a member from a team (soft delete)
   */
  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE team_members 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE team_id = $1 AND user_id = $2 AND deleted_at IS NULL
      RETURNING id
    `;
    const result = await db.query(query, [teamId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Verify user belongs to the same company as the team
   */
  async verifyUserCompany(userId: string, companyId: string): Promise<boolean> {
    const query = `
      SELECT id FROM users 
      WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query(query, [userId, companyId]);
    return result.rows.length > 0;
  }

  /**
   * Verify multiple users belong to the same company
   */
  async verifyUsersCompany(userIds: string[], companyId: string): Promise<string[]> {
    if (userIds.length === 0) return [];

    const query = `
      SELECT id FROM users 
      WHERE id = ANY($1) AND company_id = $2 AND deleted_at IS NULL
    `;
    const result = await db.query<{ id: string }>(query, [userIds, companyId]);
    return result.rows.map(row => row.id);
  }

  /**
   * Soft delete all team members when team is deleted
   */
  async deleteAllTeamMembers(teamId: string): Promise<void> {
    const query = `
      UPDATE team_members 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE team_id = $1 AND deleted_at IS NULL
    `;
    await db.query(query, [teamId]);
  }
}
