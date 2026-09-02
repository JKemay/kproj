// s3.ts is the only place that ever produces a key or signs a URL. The
// signing/network calls (createPresignedPost, getSignedUrl, S3Client#send)
// are mocked so nothing here touches AWS or resolves real credentials;
// buildKey and the MIME allowlist are pure logic and need no mocking at all.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreatePresignedPost = vi.hoisted(() => vi.fn());
const mockGetSignedUrl = vi.hoisted(() => vi.fn());
const mockSend = vi.hoisted(() => vi.fn());

vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: mockCreatePresignedPost,
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));
vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  // Keep the real Command classes (their `.input` shape is asserted on
  // below) — only the client's `send` needs to stop short of the network.
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

const { ALLOWED_MIMES, buildKey, deleteObject, isAllowedMime, signRead, signUpload } =
  await import('./s3.js');

describe('buildKey', () => {
  it('scopes a group-level key under groups/<groupId>/ with a MIME-derived extension', () => {
    const key = buildKey('lesserafim', null, 'image/png');
    expect(key).toMatch(
      /^groups\/lesserafim\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
  });

  it('nests a member-tagged key under groups/<groupId>/members/<memberId>/', () => {
    const key = buildKey('lesserafim', 'chaewon', 'image/webp');
    expect(key.startsWith('groups/lesserafim/members/chaewon/')).toBe(true);
    expect(key.endsWith('.webp')).toBe(true);
  });

  it('never reuses a UUID across calls, even for identical inputs', () => {
    const a = buildKey('g', null, 'image/jpeg');
    const b = buildKey('g', null, 'image/jpeg');
    expect(a).not.toBe(b);
  });

  it('derives the extension from the MIME type for every allowed type', () => {
    expect(buildKey('g', null, 'image/jpeg')).toMatch(/\.jpg$/);
    expect(buildKey('g', null, 'image/png')).toMatch(/\.png$/);
    expect(buildKey('g', null, 'image/webp')).toMatch(/\.webp$/);
    expect(buildKey('g', null, 'image/gif')).toMatch(/\.gif$/);
    expect(buildKey('g', null, 'image/avif')).toMatch(/\.avif$/);
  });

  it("can't be steered outside groups/<groupId>/ via a path-traversal-shaped id", () => {
    // buildKey does no sanitization of its own — the route layer's zod
    // `slug` schema (^[a-z0-9-]+$) is what actually blocks this in
    // production. This test documents that buildKey itself is not the
    // enforcement point, so a future caller that skips the slug schema
    // would NOT be protected here.
    const key = buildKey('../../etc', null, 'image/png');
    expect(key.startsWith('groups/../../etc/')).toBe(true);
  });
});

describe('MIME allowlist', () => {
  it('accepts exactly the documented image types', () => {
    expect([...ALLOWED_MIMES].sort()).toEqual(
      ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'].sort(),
    );
  });

  it('accepts every allowlisted MIME type', () => {
    for (const mime of ALLOWED_MIMES) {
      expect(isAllowedMime(mime)).toBe(true);
    }
  });

  it('rejects types outside the allowlist, including spoofing-shaped near-misses', () => {
    expect(isAllowedMime('image/svg+xml')).toBe(false); // SVG can carry script — deliberately excluded
    expect(isAllowedMime('application/pdf')).toBe(false);
    expect(isAllowedMime('video/mp4')).toBe(false);
    expect(isAllowedMime('image/png; charset=binary')).toBe(false); // exact match only
    expect(isAllowedMime('')).toBe(false);
  });
});

describe('signUpload', () => {
  beforeEach(() => {
    mockCreatePresignedPost.mockReset();
  });

  it('enforces the declared content type and a 25MB size cap at the S3 edge', async () => {
    mockCreatePresignedPost.mockResolvedValueOnce({ url: 'https://s3.example/', fields: {} });
    await signUpload('groups/g/uuid.png', 'image/png');

    expect(mockCreatePresignedPost).toHaveBeenCalledTimes(1);
    const [, opts] = mockCreatePresignedPost.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(opts.Bucket).toBe('test-bucket');
    expect(opts.Key).toBe('groups/g/uuid.png');
    expect(opts.Conditions).toContainEqual(['content-length-range', 1, 25 * 1024 * 1024]);
    expect(opts.Conditions).toContainEqual(['eq', '$Content-Type', 'image/png']);
    expect(opts.Fields).toEqual({ 'Content-Type': 'image/png' });
  });
});

describe('signRead', () => {
  beforeEach(() => {
    mockGetSignedUrl.mockReset();
  });

  it('signs a GET for the given key against the configured bucket with a bounded TTL', async () => {
    mockGetSignedUrl.mockResolvedValueOnce('https://signed.example/get');
    const url = await signRead('groups/g/uuid.png');
    expect(url).toBe('https://signed.example/get');

    const [, cmd, opts] = mockGetSignedUrl.mock.calls[0] as [
      unknown,
      { input: Record<string, unknown> },
      Record<string, unknown>,
    ];
    expect(cmd.input).toMatchObject({ Bucket: 'test-bucket', Key: 'groups/g/uuid.png' });
    expect(opts).toMatchObject({ expiresIn: 3600 });
  });
});

describe('deleteObject', () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it('sends a DeleteObjectCommand for exactly the given key', async () => {
    mockSend.mockResolvedValueOnce({});
    await deleteObject('groups/g/uuid.png');
    expect(mockSend).toHaveBeenCalledTimes(1);
    const cmd = mockSend.mock.calls[0]![0] as { input: Record<string, unknown> };
    expect(cmd.input).toMatchObject({ Bucket: 'test-bucket', Key: 'groups/g/uuid.png' });
  });
});
