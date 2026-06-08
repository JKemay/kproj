import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// `generate` doesn't connect to the DB, only `migrate`/`push`/`studio` do.
// Fall back to a placeholder so SQL generation works without a live DB.
const url =
  process.env.DATABASE_URL ?? 'postgres://placeholder:placeholder@placeholder:5432/placeholder';

if (url.includes('placeholder')) {
  // eslint-disable-next-line no-console
  console.warn(
    '[drizzle-kit] DATABASE_URL not set — `generate` will work, but `migrate`/`push`/`studio` will fail at connection time.',
  );
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
