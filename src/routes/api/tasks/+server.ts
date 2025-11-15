import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL || process.env.VITE_NHOST_GRAPHQL_URL;
const ADMIN = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_ADMIN_SECRET;

function getUserIdFromReq(request: Request) {
  // Expect client to send x-user-id header
  return request.headers.get('x-user-id') || null;
}

export const GET: RequestHandler = async ({ request }) => {
  const userId = getUserIdFromReq(request);
  if (!userId) return json({ error: 'missing x-user-id header' }, { status: 400 });
  if (!GRAPHQL_URL) return json({ error: 'GraphQL URL not configured' }, { status: 500 });

  const query = `
    query GetTasks($user_id: uuid!) {
      tasks(where: { user_id: { _eq: $user_id } }, order_by: { created_at: desc }) {
        id
        title
        description
        status
        created_at
        updated_at
        time_logs(order_by: { start_time: desc }) {
          id
          start_time
          end_time
          duration
        }
      }
    }
  `;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN) headers['x-hasura-admin-secret'] = ADMIN;

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: { user_id: userId } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });
  return json({ tasks: data.data.tasks });
};

export const POST: RequestHandler = async ({ request }) => {
  const userId = getUserIdFromReq(request);
  if (!userId) return json({ error: 'missing x-user-id header' }, { status: 400 });
  const body = await request.json();
  const { title, description } = body;
  if (!title) return json({ error: 'title required' }, { status: 400 });
  if (!GRAPHQL_URL) return json({ error: 'GraphQL URL not configured' }, { status: 500 });

  const mutation = `
    mutation CreateTask($user_id: uuid!, $title: String!, $description: String) {
      insert_tasks_one(object: { user_id: $user_id, title: $title, description: $description }) {
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
    body: JSON.stringify({ query: mutation, variables: { user_id: userId, title, description } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });
  return json({ task: data.data.insert_tasks_one });
};
