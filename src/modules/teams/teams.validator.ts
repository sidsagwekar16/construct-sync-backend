// Teams validator

import { z } from 'zod';
import { TeamMemberRole } from '../../types/enums';

/**
 * Validation schema for creating a team
 */
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(255, 'Team name must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  memberIds: z
    .array(z.string().uuid('Invalid user ID'))
    .optional()
    .default([]),
  memberRoles: z
    .record(z.string().uuid(), z.nativeEnum(TeamMemberRole))
    .optional(),
});

/**
 * Validation schema for updating a team
 */
export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name cannot be empty')
    .max(255, 'Team name must be less than 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
});

/**
 * Validation schema for adding team members
 */
export const addTeamMembersSchema = z.object({
  userIds: z
    .array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least one user ID is required')
    .max(50, 'Cannot add more than 50 members at once'),
  role: z.nativeEnum(TeamMemberRole).optional().default(TeamMemberRole.MEMBER),
});

/**
 * Validation schema for updating team member
 */
export const updateTeamMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.nativeEnum(TeamMemberRole),
});

/**
 * Validation schema for query parameters
 */
export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  includeMembers: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('false'),
});

/**
 * Validation schema for team ID parameter
 */
export const teamIdSchema = z.object({
  id: z.string().uuid('Invalid team ID'),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMembersInput = z.infer<typeof addTeamMembersSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type ListTeamsQueryInput = z.infer<typeof listTeamsQuerySchema>;
export type TeamIdInput = z.infer<typeof teamIdSchema>;
