/*
  Minimal Nhost GraphQL helper for a Vite + Svelte app.

  - Reads URLs from `import.meta.env` (Vite) or `process.env` (server-side).
  - Provides a `graphql` helper to run GraphQL requests against Nhost GraphQL endpoint.
  - Provides small helpers to read/set a client-side JWT token for authenticated requests.

  This file intentionally avoids adding runtime dependencies so it can be used
  without installing the official Nhost SDK. If you prefer the full SDK, install
  `@nhost/nhost-js` and replace this with the SDK-based client.
*/

const getEnv = (name: string, fallback?: string) => {
  // Vite exposes variables as import.meta.env.VITE_*
  // In SSR `process.env` may be available.
  if (typeof import.meta !== 'undefined' && typeof (import.meta as any).env !== 'undefined') {
    const v = (import.meta as any).env[name as any] ?? (import.meta as any).env[`VITE_${name}`];
    if (v) return String(v);
  }
  if (typeof process !== 'undefined' && process.env) {
    return (process.env as any)[name] ?? (process.env as any)[`VITE_${name}`] ?? fallback;
  }
  return fallback;
};

export const NHOST_GRAPHQL_URL = getEnv('NHOST_GRAPHQL_URL') || '';
export const VITE_NHOST_GRAPHQL_URL = getEnv('VITE_NHOST_GRAPHQL_URL') || NHOST_GRAPHQL_URL;

type GraphQLResult<T> = { data?: T; errors?: Array<{ message: string; [k: string]: any }>; };

export async function graphql<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: { token?: string; fetchFn?: typeof fetch }
): Promise<GraphQLResult<T>> {
  const url = VITE_NHOST_GRAPHQL_URL || NHOST_GRAPHQL_URL;
  if (!url) throw new Error('Nhost GraphQL URL is not configured. Set VITE_NHOST_GRAPHQL_URL or NHOST_GRAPHQL_URL.');

  const fetcher = options?.fetchFn ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined);
  if (!fetcher) throw new Error('fetch is not available in this environment.');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = options?.token ?? getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetcher(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: variables ?? {} }),
  });

  const json = await res.json();
  if (!res.ok) {
    // GraphQL servers often respond 200 with errors array; but non-2xx should still error.
    const message = json?.errors?.[0]?.message ?? res.statusText;
    const err: any = new Error(String(message));
    err.response = json;
    throw err;
  }

  return json as GraphQLResult<T>;
}

// Simple client-side token helpers. These store the token in `localStorage`.
export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token === null) {
    localStorage.removeItem('nhost_token');
  } else {
    localStorage.setItem('nhost_token', token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nhost_token');
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nhost_token');
}

export default { graphql, setToken, getToken, clearToken, NHOST_GRAPHQL_URL, VITE_NHOST_GRAPHQL_URL };
