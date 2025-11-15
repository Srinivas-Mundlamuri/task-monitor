import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const GRAPHQL_URL = process.env.NHOST_GRAPHQL_URL || process.env.VITE_NHOST_GRAPHQL_URL;
const ADMIN = process.env.NHOST_ADMIN_SECRET || process.env.HASURA_ADMIN_SECRET;

function getUserIdFromReq(request: Request) {
  return request.headers.get('x-user-id') || null;
}

export const POST: RequestHandler = async ({ request, params }) => {
  const userId = getUserIdFromReq(request);
  if (!userId) return json({ error: 'missing x-user-id header' }, { status: 400 });
  const taskId = params.id;
  if (!GRAPHQL_URL) return json({ error: 'GraphQL URL not configured' }, { status: 500 });

  const mutation = `
    mutation StartTimeLog($task_id: uuid!, $user_id: uuid!, $start_time: timestamptz!) {
      insert_time_logs_one(object: { task_id: $task_id, user_id: $user_id, start_time: $start_time }) {
        id
        start_time
        end_time
      }
    }
  `;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN) headers['x-hasura-admin-secret'] = ADMIN;

  const startTime = new Date().toISOString();

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables: { task_id: taskId, user_id: userId, start_time: startTime } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });
  return json({ time_log: data.data.insert_time_logs_one });
};
