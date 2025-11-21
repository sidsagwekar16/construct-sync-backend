// Site Media Validators

import { z } from 'zod';

export const uploadMediaSchema = z.object({
  body: z.object({
    mediaUrl: z.string().url('Invalid media URL'),
    thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
    mediaType: z.enum(['photo', 'video', 'document', 'audio']).optional(),
  }),
});

export const siteIdSchema = z.object({
  params: z.object({
    siteId: z.string().uuid('Invalid site ID'),
  }),
});

export const mediaIdSchema = z.object({
  params: z.object({
    siteId: z.string().uuid('Invalid site ID'),
    mediaId: z.string().uuid('Invalid media ID'),
  }),
});

