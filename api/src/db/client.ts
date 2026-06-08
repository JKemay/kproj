// Module-scoped Drizzle + pg pool. The first invocation in a warm Lambda
// reads the RDS master secret from Secrets Manager; subsequent invocations
// reuse the connection string and the pool.
//
// Lambda concurrency is per-instance, so `max: 1` is correct — each warm
// instance handles one request at a time and needs exactly one connection.

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as schema from '@kproj/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const RDS_SECRET_ARN = process.env.RDS_SECRET_ARN;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
const DB_NAME = process.env.DB_NAME ?? 'kproj';
if (!RDS_SECRET_ARN) throw new Error('RDS_SECRET_ARN env var is required');
if (!DB_HOST) throw new Error('DB_HOST env var is required');

const sm = new SecretsManagerClient({});
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

interface RdsSecret {
  username: string;
  password: string;
}

async function buildConnectionString(): Promise<string> {
  const res = await sm.send(new GetSecretValueCommand({ SecretId: RDS_SECRET_ARN }));
  if (!res.SecretString) throw new Error('RDS secret payload missing');
  const s = JSON.parse(res.SecretString) as RdsSecret;
  return `postgresql://${encodeURIComponent(s.username)}:${encodeURIComponent(s.password)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

/**
 * Returns a Drizzle client bound to a pooled pg connection. Cached at module
 * scope so warm invocations skip the Secrets Manager round-trip.
 */
export async function getDb() {
  if (_db) return _db;
  const url = await buildConnectionString();
  _pool = new Pool({
    connectionString: url,
    max: 1,
    ssl: { rejectUnauthorized: false }, // TODO: validate against RDS CA bundle in v2
  });
  _db = drizzle(_pool, { schema });
  return _db;
}
