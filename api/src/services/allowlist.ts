// DynamoDB-backed allowlist check.
// Used as defense-in-depth alongside the Cognito Pre-SignUp trigger:
// even if a misconfigured Pool somehow lets a non-allowlisted user
// authenticate, we won't write them to our users table.

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.ALLOWLIST_TABLE ?? 'kproj-allowlist';
const ddb = new DynamoDBClient({});

export async function isEmailAllowlisted(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return false;
  const result = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { email: { S: normalized } },
    }),
  );
  return !!result.Item;
}
