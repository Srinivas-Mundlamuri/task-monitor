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

  // Find the latest open time_log for this task and user (end_time is null), then set end_time to now
  const now = new Date().toISOString();

  const update = `
    mutation StopTimeLog($task_id: uuid!, $user_id: uuid!, $end_time: timestamptz!) {
      update_time_logs(where: { task_id: { _eq: $task_id }, user_id: { _eq: $user_id }, end_time: { _is_null: true } }, _set: { end_time: $end_time }) {
        affected_rows
      }
    }
  `;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADMIN) headers['x-hasura-admin-secret'] = ADMIN;

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: update, variables: { task_id: taskId, user_id: userId, end_time: now } }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) return json({ error: data.errors ?? 'unknown' }, { status: 500 });
  return json({ result: data.data.update_time_logs });
};
