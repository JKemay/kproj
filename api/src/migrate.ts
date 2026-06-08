// One-shot Lambda that applies pending Drizzle migrations to RDS.
//
// Deployed in the same VPC as RDS so it can reach the private endpoint.
// Reads the RDS master credentials from Secrets Manager (no passwords in
// env vars). Migrations are bundled into the zip at `./migrations/`.
//
// Invoke: aws lambda invoke --function-name kproj-migrate /tmp/out.json && cat /tmp/out.json
// Safe to invoke repeatedly — Drizzle skips already-applied migrations.

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// RDS-managed master-user secrets only contain { username, password }.
// Host, port, and dbname are stable and passed as env vars.
const RDS_SECRET_ARN = process.env.RDS_SECRET_ARN;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
const DB_NAME = process.env.DB_NAME ?? 'kproj';
if (!RDS_SECRET_ARN) throw new Error('RDS_SECRET_ARN env var is required');
if (!DB_HOST) throw new Error('DB_HOST env var is required');

const sm = new SecretsManagerClient({});

interface RdsSecret {
  username: string;
  password: string;
}

async function getDbUrl(): Promise<string> {
  const res = await sm.send(new GetSecretValueCommand({ SecretId: RDS_SECRET_ARN }));
  if (!res.SecretString) throw new Error('Secret payload missing SecretString');
  const s = JSON.parse(res.SecretString) as RdsSecret;
  // Force-encode in case the auto-generated password contains URL-reserved chars
  return `postgresql://${encodeURIComponent(s.username)}:${encodeURIComponent(s.password)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

export const handler = async () => {
  const url = await getDbUrl();
  const pool = new Pool({ connectionString: url, max: 1, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool);

  try {
    console.log('applying migrations from ./migrations');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('migrations applied');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('migration failed:', msg);
    throw err;
  } finally {
    await pool.end();
  }
};
