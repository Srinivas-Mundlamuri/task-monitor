import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL || process.env.VITE_NHOST_GRAPHQL_URL;
const ADMIN = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_ADMIN_SECRET;

function getUserIdFromReq(request: Request) {
  return request.headers.get('x-user-id') || null;
}

export const PUT: RequestHandler = async ({ request, params }) => {
  const userId = getUserIdFromReq(request);
  if (!userId) return json({ error: 'missing x-user-id header' }, { status: 400 });
  const id = params.id;
  const body = await request.json();
  const { title, description, status } = body;

  if (!GRAPHQL_URL) return json({ error: 'GraphQL URL not configured' }, { status: 500 });

  // Build _set object dynamically
  const setFields: Record<string, any> = {};
  if (title !== undefined) setFields.title = title;
  if (description !== undefined) setFields.description = description;
  if (status !== undefined) setFields.status = status;

  const mutation = `
    mutation UpdateTask($id: uuid!, $set: tasks_set_input!) {
      update_tasks_by_pk(pk_columns: { id: $id }, _set: $set) {
        id
        title
        description
        status
      }
    }
  `;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN) headers['x-hasura-admin-secret'] = ADMIN;

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables: { id, set: setFields } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });
  return json({ task: data.data.update_tasks_by_pk });
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const userId = getUserIdFromReq(request);
  if (!userId) return json({ error: 'missing x-user-id header' }, { status: 400 });
  const id = params.id;
  if (!GRAPHQL_URL) return json({ error: 'GraphQL URL not configured' }, { status: 500 });

  const mutation = `
    mutation DeleteTask($id: uuid!) {
      delete_tasks_by_pk(id: $id) { id }
    }
  `;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN) headers['x-hasura-admin-secret'] = ADMIN;

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables: { id } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });
  return json({ deleted: data.data.delete_tasks_by_pk });
};
