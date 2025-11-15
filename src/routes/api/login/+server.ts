import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL || process.env.VITE_NHOST_GRAPHQL_URL;
const ADMIN = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_ADMIN_SECRET;

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { name, password } = body;
  if (!name || !password) return json({ error: 'name and password required' }, { status: 400 });

  if (!GRAPHQL_URL) return json({ error: 'GraphQL URL not configured' }, { status: 500 });

  const query = `
    query GetProfile($name: String!, $password: String!) {
      profiles(where: { name: { _eq: $name }, password: { _eq: $password } }, limit: 1) {
        id
        name
      }
    }
  `;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN) headers['x-hasura-admin-secret'] = ADMIN;

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: { name, password } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });

  const profile = data.data.profiles?.[0] ?? null;
  if (!profile) return json({ error: 'invalid credentials' }, { status: 401 });

  return json({ profile });
};
