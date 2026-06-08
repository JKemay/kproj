// Zod schemas for media routes.

import { z } from 'zod';

import { ALLOWED_MIMES } from '../services/s3.js';

const slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'must be lowercase letters, digits, hyphens only');

export const signUploadsBody = z.object({
  uploads: z
    .array(
      z.object({
        clientRef: z.string().min(1).max(100),
        groupId: slug,
        memberId: slug.optional(),
        contentType: z.enum(ALLOWED_MIMES as [string, ...string[]]),
        sizeBytes: z.number().int().min(1).max(25 * 1024 * 1024),
      }),
    )
    .min(1)
    .max(20),
});
export type SignUploadsBody = z.infer<typeof signUploadsBody>;

export const signReadsBody = z.object({
  keys: z.array(z.string().min(1).max(500)).min(1).max(100),
});
export type SignReadsBody = z.infer<typeof signReadsBody>;

export const registerMediaBody = z.object({
  s3Key: z.string().min(1).max(500),
  groupId: slug,
  memberId: slug.optional(),
  kind: z.enum(['image', 'gif', 'video']),
  caption: z.string().max(500).optional(),
});
export type RegisterMediaBody = z.infer<typeof registerMediaBody>;

export const updateMediaBody = z
  .object({
    caption: z.string().max(500).nullable().optional(),
  })
  .strict();
export type UpdateMediaBody = z.infer<typeof updateMediaBody>;
