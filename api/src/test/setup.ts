// Vitest setupFiles entry — runs before any test file's imports.
//
// A handful of modules (verifyJwt, requireAdmin, s3) read their config from
// process.env at *import* time and throw immediately if it's missing — a
// deliberate fail-fast so a misconfigured Lambda dies at cold start rather
// than serving requests half-configured. That means importing them in a test
// needs these vars set up front, before the module graph is even loaded.
//
// db/client.ts has the same pattern (RDS_SECRET_ARN, DB_HOST) but is never
// imported for real in this suite — every test that reaches a route or
// middleware importing it mocks '../db/client.js' wholesale via vi.mock, so
// the real module (and its Secrets Manager / pg pool) never executes.
process.env.COGNITO_USER_POOL_ID = 'us-east-1_testPool';
process.env.COGNITO_APP_CLIENT_ID = 'test-client-id';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.S3_BUCKET = 'test-bucket';
