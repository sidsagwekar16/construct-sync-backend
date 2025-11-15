// Tasks validator

import { z } from 'zod';
import { TaskStatus, PriorityLevel } from '../../types/enums';

/**
 * Validation schema for creating a task
 */
export const createTaskSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  jobUnitId: z.string().uuid('Invalid job unit ID').optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.PENDING),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.MEDIUM),
  dueDate: z.string().datetime().or(z.string().date()).optional(),
});

/**
 * Validation schema for updating a task
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title cannot be empty')
    .max(255, 'Task title must be less than 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  jobUnitId: z.string().uuid('Invalid job unit ID').optional().nullable(),
  assignedTo: z.string().uuid('Invalid user ID').optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  dueDate: z.string().datetime().or(z.string().date()).optional().nullable(),
});

/**
 * Validation schema for query parameters
 */
export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  jobId: z.string().uuid('Invalid job ID').optional(),
  jobUnitId: z.string().uuid('Invalid job unit ID').optional(),
});

/**
 * Validation schema for task ID parameter
 */
export const taskIdSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
