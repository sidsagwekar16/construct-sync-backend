// Job Media Validators

import { z } from 'zod';

export const uploadPhotoSchema = z.object({
  body: z.object({
    photoUrl: z.string().url('Invalid photo URL'),
    thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
    caption: z.string().max(500, 'Caption must be 500 characters or less').optional(),
  }),
});

export const uploadDocumentSchema = z.object({
  body: z.object({
    documentName: z.string().min(1, 'Document name is required').max(255, 'Document name must be 255 characters or less'),
    documentUrl: z.string().url('Invalid document URL'),
    documentType: z.enum(['blueprint', 'specification', 'contract', 'invoice', 'permit', 'inspection_report', 'safety_report', 'photo', 'video', 'other']).optional(),
  }),
});

export const jobIdSchema = z.object({
  params: z.object({
    jobId: z.string().uuid('Invalid job ID'),
  }),
});

export const photoIdSchema = z.object({
  params: z.object({
    jobId: z.string().uuid('Invalid job ID'),
    photoId: z.string().uuid('Invalid photo ID'),
  }),
});

export const documentIdSchema = z.object({
  params: z.object({
    jobId: z.string().uuid('Invalid job ID'),
    documentId: z.string().uuid('Invalid document ID'),
  }),
});



