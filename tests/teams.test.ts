import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole, TeamMemberRole } from '../src/types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Teams API Tests', () => {
  let app: any;
  let authToken: string;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockTeamId = '123e4567-e89b-12d3-a456-426614174010';

  beforeAll(() => {
    app = createApp();
    
    // Generate a valid JWT token for testing
    authToken = jwt.sign(
      {
        userId: mockUserId,
        email: 'test@example.com',
        role: UserRole.COMPANY_ADMIN,
        companyId: mockCompanyId,
      },
      env.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/teams', () => {
    it('should create a new team successfully', async () => {
      const teamData = {
        name: 'Development Team',
        description: 'Team for software development',
      };

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: teamData.name,
        description: teamData.description,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database calls
      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // createTeam
        .mockResolvedValueOnce({ rows: [] } as any); // getTeamMembers

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Team created successfully');
      expect(response.body.data).toHaveProperty('id', mockTeamId);
      expect(response.body.data).toHaveProperty('name', teamData.name);
      expect(response.body.data).toHaveProperty('description', teamData.description);
      expect(response.body.data).toHaveProperty('members');
    });

    it('should create a team with initial members', async () => {
      const memberUserId = '123e4567-e89b-12d3-a456-426614174002';
      const teamData = {
        name: 'Project Team',
        description: 'Team for project management',
        memberIds: [memberUserId],
        memberRoles: { [memberUserId]: TeamMemberRole.LEAD },
      };

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: teamData.name,
        description: teamData.description,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMember = {
        id: '123e4567-e89b-12d3-a456-426614174020',
        team_id: mockTeamId,
        user_id: memberUserId,
        role: TeamMemberRole.LEAD,
        deleted_at: null,
        created_at: new Date(),
        user_email: 'member@example.com',
        user_first_name: 'John',
        user_last_name: 'Doe',
        user_role: UserRole.PROJECT_MANAGER,
      };

      // Mock database calls
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: memberUserId }] } as any) // verifyUsersCompany
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // createTeam
        .mockResolvedValueOnce({ rows: [mockMember] } as any) // addTeamMember
        .mockResolvedValueOnce({ rows: [mockMember] } as any); // getTeamMembers

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].teamRole).toBe(TeamMemberRole.LEAD);
    });

    it('should fail with invalid team name', async () => {
      const teamData = {
        name: '', // Empty name
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const teamData = {
        name: 'Test Team',
      };

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token is required');
    });

    it('should fail with invalid member IDs', async () => {
      const teamData = {
        name: 'Test Team',
        memberIds: ['invalid-user-id'],
      };

      // Mock that users don't exist
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams', () => {
    it('should list all teams for a company', async () => {
      const mockTeams = [
        {
          id: mockTeamId,
          company_id: mockCompanyId,
          name: 'Team 1',
          description: 'First team',
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174011',
          company_id: mockCompanyId,
          name: 'Team 2',
          description: 'Second team',
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock database calls
      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any) // count query
        .mockResolvedValueOnce({ rows: mockTeams } as any) // findTeamsByCompany
        .mockResolvedValueOnce({ rows: [{ team_id: mockTeamId, count: '3' }] } as any); // getTeamMemberCounts

      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teams).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
    });

    it('should filter teams by search term', async () => {
      const mockTeams = [
        {
          id: mockTeamId,
          company_id: mockCompanyId,
          name: 'Development Team',
          description: 'Dev team',
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockTeams } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/teams?search=Development')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teams).toHaveLength(1);
    });

    it('should paginate teams correctly', async () => {
      const mockTeams = [
        {
          id: mockTeamId,
          company_id: mockCompanyId,
          name: 'Team 1',
          description: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] } as any)
        .mockResolvedValueOnce({ rows: mockTeams } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/teams?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get a team by ID', async () => {
      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: 'Test description',
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: [{ count: '5' }] } as any); // getTeamMemberCount

      const response = await request(app)
        .get(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockTeamId);
      expect(response.body.data).toHaveProperty('name', 'Test Team');
      expect(response.body.data).toHaveProperty('memberCount', 5);
    });

    it('should get a team with members', async () => {
      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMembers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174020',
          team_id: mockTeamId,
          user_id: '123e4567-e89b-12d3-a456-426614174002',
          role: TeamMemberRole.LEAD,
          deleted_at: null,
          created_at: new Date(),
          user_email: 'lead@example.com',
          user_first_name: 'Jane',
          user_last_name: 'Smith',
          user_role: UserRole.PROJECT_MANAGER,
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: mockMembers } as any); // getTeamMembers

      const response = await request(app)
        .get(`/api/teams/${mockTeamId}?includeMembers=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('members');
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].teamRole).toBe(TeamMemberRole.LEAD);
    });

    it('should return 404 for non-existent team', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Team not found');
    });
  });

  describe('PATCH /api/teams/:id', () => {
    it('should update a team successfully', async () => {
      const updateData = {
        name: 'Updated Team Name',
        description: 'Updated description',
      };

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Original Name',
        description: 'Original description',
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedTeam = {
        ...mockTeam,
        name: updateData.name,
        description: updateData.description,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: [updatedTeam] } as any) // updateTeam
        .mockResolvedValueOnce({ rows: [{ count: '3' }] } as any); // getTeamMemberCount

      const response = await request(app)
        .patch(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Team updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should update only name', async () => {
      const updateData = {
        name: 'New Name Only',
      };

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Old Name',
        description: 'Keep this description',
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockTeam, name: updateData.name }] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);

      const response = await request(app)
        .patch(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should return 404 for non-existent team', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete a team successfully', async () => {
      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Team to Delete',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: [] } as any) // deleteAllTeamMembers
        .mockResolvedValueOnce({ rows: [{ id: mockTeamId }] } as any); // deleteTeam

      const response = await request(app)
        .delete(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Team deleted successfully');
    });

    it('should return 404 for non-existent team', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/teams/${mockTeamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Team not found');
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add members to a team successfully', async () => {
      const memberIds = [
        '123e4567-e89b-12d3-a456-426614174002',
        '123e4567-e89b-12d3-a456-426614174003',
      ];

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMembers = memberIds.map((userId, index) => ({
        id: `member-${index}`,
        team_id: mockTeamId,
        user_id: userId,
        role: TeamMemberRole.MEMBER,
        deleted_at: null,
        created_at: new Date(),
        user_email: `user${index}@example.com`,
        user_first_name: `User`,
        user_last_name: `${index}`,
        user_role: UserRole.WORKER,
      }));

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: memberIds.map(id => ({ id })) } as any) // verifyUsersCompany
        .mockResolvedValueOnce({ rows: mockMembers } as any) // addTeamMembers
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById (for getTeamMembers)
        .mockResolvedValueOnce({ rows: mockMembers } as any); // getTeamMembers

      const response = await request(app)
        .post(`/api/teams/${mockTeamId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userIds: memberIds, role: TeamMemberRole.MEMBER })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Members added successfully');
      expect(response.body.data).toHaveLength(2);
    });

    it('should fail with invalid user IDs', async () => {
      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // No valid users

      const response = await request(app)
        .post(`/api/teams/${mockTeamId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userIds: ['invalid-id'] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams/:id/members', () => {
    it('should get team members successfully', async () => {
      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMembers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174020',
          team_id: mockTeamId,
          user_id: '123e4567-e89b-12d3-a456-426614174002',
          role: TeamMemberRole.LEAD,
          deleted_at: null,
          created_at: new Date(),
          user_email: 'lead@example.com',
          user_first_name: 'John',
          user_last_name: 'Lead',
          user_role: UserRole.PROJECT_MANAGER,
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any)
        .mockResolvedValueOnce({ rows: mockMembers } as any);

      const response = await request(app)
        .get(`/api/teams/${mockTeamId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].teamRole).toBe(TeamMemberRole.LEAD);
    });
  });

  describe('PATCH /api/teams/:id/members', () => {
    it('should update team member role successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174002';
      const updateData = {
        userId,
        role: TeamMemberRole.LEAD,
      };

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMember = {
        id: '123e4567-e89b-12d3-a456-426614174020',
        team_id: mockTeamId,
        user_id: userId,
        role: TeamMemberRole.LEAD,
        deleted_at: null,
        created_at: new Date(),
        user_email: 'user@example.com',
        user_first_name: 'John',
        user_last_name: 'Doe',
        user_role: UserRole.WORKER,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: [{ id: userId }] } as any) // verifyUserCompany
        .mockResolvedValueOnce({ rows: [{ id: 'member-id' }] } as any) // isUserInTeam
        .mockResolvedValueOnce({ rows: [mockMember] } as any) // updateTeamMemberRole
        .mockResolvedValueOnce({ rows: [mockMember] } as any); // getTeamMembers

      const response = await request(app)
        .patch(`/api/teams/${mockTeamId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Member role updated successfully');
      expect(response.body.data.teamRole).toBe(TeamMemberRole.LEAD);
    });

    it('should fail when user is not in team', async () => {
      const validUserId = '123e4567-e89b-12d3-a456-426614174002';
      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: [{ id: validUserId }] } as any) // verifyUserCompany
        .mockResolvedValueOnce({ rows: [] } as any); // isUserInTeam - User not in team

      const response = await request(app)
        .patch(`/api/teams/${mockTeamId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: validUserId, role: TeamMemberRole.LEAD })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/teams/:id/members/:userId', () => {
    it('should remove team member successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174002';

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any) // findTeamById
        .mockResolvedValueOnce({ rows: [{ id: 'member-id' }] } as any) // isUserInTeam
        .mockResolvedValueOnce({ rows: [{ id: 'member-id' }] } as any); // removeTeamMember

      const response = await request(app)
        .delete(`/api/teams/${mockTeamId}/members/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Member removed successfully');
    });

    it('should return 404 when user is not in team', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174002';

      const mockTeam = {
        id: mockTeamId,
        company_id: mockCompanyId,
        name: 'Test Team',
        description: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTeam] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // User not in team

      const response = await request(app)
        .delete(`/api/teams/${mockTeamId}/members/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User is not a member of this team');
    });
  });
});

