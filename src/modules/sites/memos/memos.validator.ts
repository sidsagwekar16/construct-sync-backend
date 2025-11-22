// Site Memos Validators

import { z } from 'zod';

export const createMemoSchema = z.object({
  body: z.object({
    title: z.string().max(255, 'Title must be 255 characters or less').optional(),
    content: z.string().min(1, 'Content is required'),
  }),
});

export const updateMemoSchema = z.object({
  body: z.object({
    title: z.string().max(255, 'Title must be 255 characters or less').optional(),
    content: z.string().min(1, 'Content is required').optional(),
  }),
});

export const siteIdSchema = z.object({
  params: z.object({
    siteId: z.string().uuid('Invalid site ID'),
  }),
});

export const memoIdSchema = z.object({
  params: z.object({
    siteId: z.string().uuid('Invalid site ID'),
    memoId: z.string().uuid('Invalid memo ID'),
  }),
});



