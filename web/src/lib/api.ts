// Tiny fetch wrapper that injects the Cognito ID token as a Bearer header
// and surfaces structured server errors as throws.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is required');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown; // accept any JSON-serializable value
  idToken?: string | null;
}

export async function apiFetch<T = unknown>(
  path: string,
  { body, idToken, headers, ...rest }: ApiFetchOptions = {},
): Promise<T> {
  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(`${API_URL}${path}`, init);
  const text = await res.text();
  const json = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const msg =
      (json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
        ? json.error
        : `HTTP ${res.status}`) ?? `HTTP ${res.status}`;
    const code =
      json && typeof json === 'object' && 'code' in json && typeof json.code === 'string'
        ? json.code
        : undefined;
    throw new ApiError(res.status, msg, code, json);
  }

  return json as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
