// Job diary types and validators

import { z } from 'zod';

/**
 * Database model for job diary entries
 */
export interface JobDiary {
  id: string;
  jobId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Request body for creating a diary entry
 */
export interface CreateDiaryRequest {
  content: string;
}

/**
 * Validation schema for creating a diary entry
 */
export const createDiarySchema = z.object({
  body: z.object({
    content: z.string()
      .min(1, 'Diary content is required')
      .max(5000, 'Diary content must be less than 5000 characters'),
  }),
});

export type CreateDiaryValidation = z.infer<typeof createDiarySchema>;
