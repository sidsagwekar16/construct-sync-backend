import request from 'supertest';
import { createApp } from '../src/app';
import { mockDbQuery } from './setup';
import { UserRole, TaskStatus, PriorityLevel } from '../src/types/enums';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Tasks API Tests', () => {
  let app: any;
  let authToken: string;
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockCompanyId = '123e4567-e89b-12d3-a456-426614174000';
  const mockJobId = '123e4567-e89b-12d3-a456-426614174040';
  const mockJobUnitId = '123e4567-e89b-12d3-a456-426614174050';
  const mockTaskId = '123e4567-e89b-12d3-a456-426614174060';
  const mockAssignedUserId = '123e4567-e89b-12d3-a456-426614174002';

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

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        jobId: mockJobId,
        title: 'Install electrical wiring',
        description: 'Install all electrical wiring in building A',
        jobUnitId: mockJobUnitId,
        assignedTo: mockAssignedUserId,
        status: TaskStatus.PENDING,
        priority: PriorityLevel.HIGH,
        dueDate: '2024-12-31',
      };

      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: mockJobUnitId,
        assigned_to: mockAssignedUserId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        due_date: new Date(taskData.dueDate),
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] } as any) // verifyJobCompany
        .mockResolvedValueOnce({ rows: [{ id: mockJobUnitId }] } as any) // verifyJobUnitCompany
        .mockResolvedValueOnce({ rows: [{ id: mockAssignedUserId }] } as any) // verifyUserCompany
        .mockResolvedValueOnce({ rows: [mockTask] } as any); // createTask

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.data).toHaveProperty('id', mockTaskId);
      expect(response.body.data).toHaveProperty('title', taskData.title);
      expect(response.body.data).toHaveProperty('status', taskData.status);
    });

    it('should create a task with minimal fields', async () => {
      const taskData = {
        jobId: mockJobId,
        title: 'Simple Task',
      };

      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: null,
        assigned_to: null,
        title: taskData.title,
        description: null,
        status: TaskStatus.PENDING,
        priority: PriorityLevel.MEDIUM,
        due_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] } as any)
        .mockResolvedValueOnce({ rows: [mockTask] } as any);

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    it('should fail with invalid job ID', async () => {
      const taskData = {
        jobId: mockJobId,
        title: 'Test Task',
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any); // Job doesn't exist

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Job does not exist');
    });

    it('should fail with invalid job unit ID', async () => {
      const taskData = {
        jobId: mockJobId,
        title: 'Test Task',
        jobUnitId: mockJobUnitId,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // Job unit doesn't exist

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Job unit does not exist');
    });

    it('should fail with invalid assigned user', async () => {
      const taskData = {
        jobId: mockJobId,
        title: 'Test Task',
        assignedTo: mockAssignedUserId,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockJobId }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // User doesn't exist

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Assigned user does not exist');
    });

    it('should fail without authentication', async () => {
      const taskData = {
        jobId: mockJobId,
        title: 'Test Task',
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with empty title', async () => {
      const taskData = {
        jobId: mockJobId,
        title: '',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    it('should list all tasks for a company', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: mockAssignedUserId,
          title: 'Task 1',
          description: 'Description 1',
          status: TaskStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
          due_date: new Date('2024-12-31'),
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174061',
          job_id: mockJobId,
          job_unit_id: mockJobUnitId,
          assigned_to: null,
          title: 'Task 2',
          description: null,
          status: TaskStatus.PENDING,
          priority: PriorityLevel.MEDIUM,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter tasks by search term', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: null,
          title: 'Install wiring',
          description: null,
          status: TaskStatus.PENDING,
          priority: PriorityLevel.MEDIUM,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get('/api/tasks?search=wiring')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(1);
    });

    it('should filter tasks by status', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: null,
          title: 'Active Task',
          description: null,
          status: TaskStatus.IN_PROGRESS,
          priority: PriorityLevel.MEDIUM,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get(`/api/tasks?status=${TaskStatus.IN_PROGRESS}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks[0].status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should filter tasks by priority', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: null,
          title: 'Urgent Task',
          description: null,
          status: TaskStatus.PENDING,
          priority: PriorityLevel.URGENT,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get(`/api/tasks?priority=${PriorityLevel.URGENT}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks[0].priority).toBe(PriorityLevel.URGENT);
    });

    it('should filter tasks by assigned user', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: mockAssignedUserId,
          title: 'Assigned Task',
          description: null,
          status: TaskStatus.PENDING,
          priority: PriorityLevel.MEDIUM,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get(`/api/tasks?assignedTo=${mockAssignedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks[0].assignedTo).toBe(mockAssignedUserId);
    });

    it('should filter tasks by job ID', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: null,
          title: 'Job Task',
          description: null,
          status: TaskStatus.PENDING,
          priority: PriorityLevel.MEDIUM,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get(`/api/tasks?jobId=${mockJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks[0].jobId).toBe(mockJobId);
    });

    it('should paginate tasks correctly', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: null,
          title: 'Task 1',
          description: null,
          status: TaskStatus.PENDING,
          priority: PriorityLevel.MEDIUM,
          due_date: null,
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ count: '20' }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get('/api/tasks?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a task by ID', async () => {
      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: mockJobUnitId,
        assigned_to: mockAssignedUserId,
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.IN_PROGRESS,
        priority: PriorityLevel.HIGH,
        due_date: new Date('2024-12-31'),
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockTask] } as any);

      const response = await request(app)
        .get(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', mockTaskId);
      expect(response.body.data).toHaveProperty('title', 'Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('should update a task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: TaskStatus.IN_PROGRESS,
        priority: PriorityLevel.URGENT,
      };

      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: null,
        assigned_to: null,
        title: 'Original Title',
        description: 'Original description',
        status: TaskStatus.PENDING,
        priority: PriorityLevel.MEDIUM,
        due_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedTask = {
        ...mockTask,
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        priority: updateData.priority,
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTask] } as any)
        .mockResolvedValueOnce({ rows: [updatedTask] } as any);

      const response = await request(app)
        .patch(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should update task assignment', async () => {
      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: null,
        assigned_to: null,
        title: 'Test Task',
        description: null,
        status: TaskStatus.PENDING,
        priority: PriorityLevel.MEDIUM,
        due_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTask] } as any)
        .mockResolvedValueOnce({ rows: [{ id: mockAssignedUserId }] } as any)
        .mockResolvedValueOnce({ rows: [{ ...mockTask, assigned_to: mockAssignedUserId }] } as any);

      const response = await request(app)
        .patch(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assignedTo: mockAssignedUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignedTo).toBe(mockAssignedUserId);
    });

    it('should fail with invalid assigned user', async () => {
      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: null,
        assigned_to: null,
        title: 'Test Task',
        description: null,
        status: TaskStatus.PENDING,
        priority: PriorityLevel.MEDIUM,
        due_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTask] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // User doesn't exist

      const response = await request(app)
        .patch(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assignedTo: mockAssignedUserId })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .patch(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task successfully', async () => {
      const mockTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: null,
        assigned_to: null,
        title: 'Task to Delete',
        description: null,
        status: TaskStatus.PENDING,
        priority: PriorityLevel.MEDIUM,
        due_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery
        .mockResolvedValueOnce({ rows: [mockTask] } as any)
        .mockResolvedValueOnce({ rows: [{ id: mockTaskId }] } as any);

      const response = await request(app)
        .delete(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');
    });

    it('should return 404 for non-existent task', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .delete(`/api/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('POST /api/tasks/:id/restore', () => {
    it('should restore a deleted task successfully', async () => {
      const mockRestoredTask = {
        id: mockTaskId,
        job_id: mockJobId,
        job_unit_id: null,
        assigned_to: null,
        title: 'Restored Task',
        description: null,
        status: TaskStatus.PENDING,
        priority: PriorityLevel.MEDIUM,
        due_date: null,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDbQuery.mockResolvedValueOnce({ rows: [mockRestoredTask] } as any);

      const response = await request(app)
        .post(`/api/tasks/${mockTaskId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task restored successfully');
      expect(response.body.data.id).toBe(mockTaskId);
    });

    it('should return 404 for non-existent or active task', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .post(`/api/tasks/${mockTaskId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found or already active');
    });
  });

  describe('GET /api/tasks/statistics', () => {
    it('should get task statistics successfully', async () => {
      const mockStats = [
        { status: TaskStatus.PENDING, count: '15' },
        { status: TaskStatus.IN_PROGRESS, count: '8' },
        { status: TaskStatus.COMPLETED, count: '22' },
        { status: TaskStatus.BLOCKED, count: '3' },
      ];

      mockDbQuery.mockResolvedValueOnce({ rows: mockStats } as any);

      const response = await request(app)
        .get('/api/tasks/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total', 48);
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data.byStatus[TaskStatus.PENDING]).toBe(15);
      expect(response.body.data.byStatus[TaskStatus.IN_PROGRESS]).toBe(8);
    });

    it('should return empty statistics when no tasks exist', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get('/api/tasks/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.byStatus).toEqual({});
    });
  });

  describe('GET /api/tasks/by-user/:userId', () => {
    it('should get tasks by user successfully', async () => {
      const mockTasks = [
        {
          id: mockTaskId,
          job_id: mockJobId,
          job_unit_id: null,
          assigned_to: mockAssignedUserId,
          title: 'User Task 1',
          description: null,
          status: TaskStatus.IN_PROGRESS,
          priority: PriorityLevel.HIGH,
          due_date: new Date('2024-12-31'),
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDbQuery
        .mockResolvedValueOnce({ rows: [{ id: mockAssignedUserId }] } as any)
        .mockResolvedValueOnce({ rows: mockTasks } as any);

      const response = await request(app)
        .get(`/api/tasks/by-user/${mockAssignedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignedTo).toBe(mockAssignedUserId);
    });

    it('should return 404 for non-existent user', async () => {
      mockDbQuery.mockResolvedValueOnce({ rows: [] } as any);

      const response = await request(app)
        .get(`/api/tasks/by-user/${mockAssignedUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });
});


