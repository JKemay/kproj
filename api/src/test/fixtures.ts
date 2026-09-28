// Row/payload builders shared across test files. Each takes overrides so a
// test only spells out the fields it actually cares about.
import type { CognitoIdTokenPayload } from 'aws-jwt-verify/jwt-model';

import type { Group, Media, Member, User } from '@kproj/db/schema';

let seq = 0;

/** A structurally-valid Cognito ID token payload (all required claims present). */
export function makeIdTokenPayload(
  overrides: Partial<CognitoIdTokenPayload> = {},
): CognitoIdTokenPayload {
  seq += 1;
  const now = Math.floor(Date.now() / 1000);
  return {
    token_use: 'id',
    sub: `sub-${seq}`,
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_testPool',
    aud: 'test-client-id',
    exp: now + 3600,
    iat: now,
    auth_time: now,
    jti: `jti-${seq}`,
    origin_jti: `origin-jti-${seq}`,
    at_hash: 'hash',
    'cognito:username': `user-${seq}`,
    email_verified: true,
    phone_number_verified: false,
    identities: [],
    'cognito:roles': [],
    'cognito:preferred_role': '',
    email: `user${seq}@example.com`,
    ...overrides,
  } as CognitoIdTokenPayload;
}

export function makeUserRow(overrides: Partial<User> = {}): User {
  seq += 1;
  return {
    id: `user-id-${seq}`,
    email: `user${seq}@example.com`,
    emailVerified: true,
    isAllowed: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeGroupRow(overrides: Partial<Group> = {}): Group {
  return {
    id: 'lesserafim',
    name: 'LE SSERAFIM',
    kind: 'group',
    debutYear: 2022,
    agency: 'Source Music',
    coverMediaKey: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeMemberRow(overrides: Partial<Member> = {}): Member {
  return {
    id: 'chaewon',
    groupId: 'lesserafim',
    stageName: 'Chaewon',
    position: 'Leader',
    bio: null,
    profileMediaKey: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeMediaRow(overrides: Partial<Media> = {}): Media {
  seq += 1;
  return {
    id: `media-id-${seq}`,
    s3Key: `groups/lesserafim/${seq}.jpg`,
    groupId: 'lesserafim',
    memberId: null,
    eraId: null,
    kind: 'image',
    caption: null,
    tags: [],
    uploadedAt: new Date('2024-01-01T00:00:00Z'),
    uploadedBy: null,
    ...overrides,
  };
}
