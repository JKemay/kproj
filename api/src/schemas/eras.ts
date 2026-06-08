// Zod schemas for era request bodies.

import { z } from 'zod';

// Accept "YYYY-MM-DD" or empty/undefined.
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .nullable()
  .optional();

export const createEraBody = z.object({
  label: z.string().min(1).max(100),
  releaseDate: dateStr,
  sortOrder: z.number().int().min(0).max(100000).optional(),
});
export type CreateEraBody = z.infer<typeof createEraBody>;

export const updateEraBody = z
  .object({
    label: z.string().min(1).max(100).optional(),
    releaseDate: dateStr,
    sortOrder: z.number().int().min(0).max(100000).optional(),
  })
  .strict();
export type UpdateEraBody = z.infer<typeof updateEraBody>;
