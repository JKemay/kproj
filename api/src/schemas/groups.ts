// Zod schemas for groups + members request bodies.
// CHECK constraints in Postgres are the last line of defense; these are
// the first line and produce structured client errors.

import { z } from 'zod';

const slug = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'must be lowercase letters, digits, hyphens only');

export const createGroupBody = z.object({
  id: slug,
  name: z.string().min(1).max(100),
  kind: z.enum(['group', 'soloist', 'topic']).optional(),
  debutYear: z.number().int().min(1990).max(2100).optional(),
  agency: z.string().max(100).optional(),
});
export type CreateGroupBody = z.infer<typeof createGroupBody>;

export const createMemberBody = z.object({
  id: slug,
  stageName: z.string().min(1).max(100),
  position: z.string().max(100).optional(),
  bio: z.string().max(5000).optional(),
});
export type CreateMemberBody = z.infer<typeof createMemberBody>;

// ---- Updates (PATCH) ----
// All fields optional; `.strict()` rejects unknown keys. `coverMediaKey` /
// `profileMediaKey` accept null to clear, or an s3Key string to set the
// cover/profile image to an already-uploaded media object.

export const updateGroupBody = z
  .object({
    name: z.string().min(1).max(100).optional(),
    kind: z.enum(['group', 'soloist', 'topic']).optional(),
    debutYear: z.number().int().min(1990).max(2100).nullable().optional(),
    agency: z.string().max(100).nullable().optional(),
    coverMediaKey: z.string().max(500).nullable().optional(),
  })
  .strict();
export type UpdateGroupBody = z.infer<typeof updateGroupBody>;

export const updateMemberBody = z
  .object({
    stageName: z.string().min(1).max(100).optional(),
    position: z.string().max(100).nullable().optional(),
    bio: z.string().max(5000).nullable().optional(),
    profileMediaKey: z.string().max(500).nullable().optional(),
  })
  .strict();
export type UpdateMemberBody = z.infer<typeof updateMemberBody>;
