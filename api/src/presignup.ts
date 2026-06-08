// Cognito Pre Sign-up trigger.
//
// Rejects sign-ups whose email isn't in the kproj-allowlist DynamoDB table.
// Non-allowlisted accounts never get created in the User Pool — the cleanest
// possible allowlist enforcement.
//
// For Google federation, the user's email is already verified by Google; we
// auto-confirm so they skip the "verify email" step Cognito would otherwise show.

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import type { PreSignUpTriggerHandler } from 'aws-lambda';

const TABLE_NAME = process.env.ALLOWLIST_TABLE ?? 'kproj-allowlist';
const ddb = new DynamoDBClient({});

export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = (event.request.userAttributes.email ?? '').toLowerCase().trim();
  if (!email) {
    throw new Error('Email is required to sign up.');
  }

  const result = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { email: { S: email } },
    }),
  );

  if (!result.Item) {
    // This message is shown to the user by the Hosted UI. Keep it useful but vague.
    throw new Error(`Sign-up is invite-only. Email ${email} is not on the allowlist.`);
  }

  // Allowlisted federated user → auto-confirm + auto-verify the email so they
  // can sign in immediately. (Without this, Cognito holds the account in
  // CONFIRM_SIGN_UP state and asks for an email-verification code.)
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
};
