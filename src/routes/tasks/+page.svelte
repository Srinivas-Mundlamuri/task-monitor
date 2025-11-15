<script lang="ts">
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';
  import { get } from 'svelte/store';

  type Task = { id: string; title: string; description?: string; status: string; time_logs?: Array<any> };

  let tasks: Task[] = [];
  let loading = false;
  let name = '';
  let description = '';
  let editing: string | null = null;
  let editTitle = '';
  let editDescription = '';
  let error: string | null = null;

  function userId() {
    const p = get(profile);
    return p?.id ?? null;
  }

  async function load() {
    const uid = userId();
    if (!uid) return;
    loading = true;
    try {
      const res = await fetch(`/api/tasks`, { headers: { 'x-user-id': uid } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load tasks');
      tasks = json.tasks;
    } catch (err: any) {
      error = err?.message ?? String(err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    const uid = userId();
    if (!uid) {
      // Not logged in: show permission denied message instead of redirecting.
      // The UI is kept under /dashboard/tasks; use that route for actual access.
      error = 'Permission denied. You must be logged in to access tasks. Please log in.';
      return;
    }
    load();
  });

  async function createTask() {
    error = null;
    const uid = userId();
    if (!uid) return;
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': uid }, body: JSON.stringify({ title: name, description }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Create failed');
      name = '';
      description = '';
      tasks.unshift(json.task);
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }

  function totalSecondsForTask(t: Task) {
    if (!t.time_logs) return 0;
    let seconds = 0;
    for (const l of t.time_logs) {
      if (!l.end_time) continue; // skip active
      // duration from Hasura may be returned as string like "00:10:00"
      const d = l.duration;
      if (!d) {
        // fallback: compute from times
        const start = new Date(l.start_time).getTime();
        const end = new Date(l.end_time).getTime();
        if (!isNaN(start) && !isNaN(end)) seconds += Math.round((end - start) / 1000);
        continue;
      }
      // parse HH:MM:SS or ISO interval
      const parts = String(d).split(':').map(Number);
      if (parts.length === 3) seconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return seconds;
  }

  function formatSeconds(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  async function removeTask(id: string) {
    if (!confirm('Delete this task?')) return;
    try {
      const uid = userId();
      const headers: Record<string, string> = {};
      if (uid) headers['x-user-id'] = uid;
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      tasks = tasks.filter(t => t.id !== id);
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }

  function startEdit(t: Task) {
    editing = t.id;
    editTitle = t.title;
    editDescription = t.description ?? '';
  }

    async function saveEdit(id: string) {
    try {
      const uid = userId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (uid) headers['x-user-id'] = uid;
      const res = await fetch(`/api/tasks/${id}`, { method: 'PUT', headers, body: JSON.stringify({ title: editTitle, description: editDescription }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks[idx] = json.task;
      editing = null;
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }

    async function startTracking(id: string) {
    try {
      const uid = userId();
      const headers: Record<string, string> = {};
      if (uid) headers['x-user-id'] = uid;
      const res = await fetch(`/api/tasks/${id}/start`, { method: 'POST', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Start failed');
      await load();
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }

    async function stopTracking(id: string) {
    try {
      const uid = userId();
      const headers: Record<string, string> = {};
      if (uid) headers['x-user-id'] = uid;
      const res = await fetch(`/api/tasks/${id}/stop`, { method: 'POST', headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Stop failed');
      await load();
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }
</script>

<style>
  .container { max-width: 900px; margin: 28px auto; padding: 12px }
  .task { border:1px solid #eee; padding:12px; margin-bottom:10px; border-radius:8px; display:flex; justify-content:space-between }
  .left { flex:1 }
  .actions { display:flex; gap:8px }
  .small { font-size:0.9rem; color:#666 }
</style>

<div class="container">
  <h2>Your Tasks</h2>

  <div style="margin-bottom:18px">
    <input placeholder="Quick task (natural language)" bind:value={name} style="width:60%;padding:8px;margin-right:8px" />
    <input placeholder="Description (optional)" bind:value={description} style="width:30%;padding:8px;margin-right:8px" />
    <button on:click={createTask}>Create</button>
  </div>

  {#if loading}
    <div>Loading…</div>
  {/if}

  {#if error}
    <div style="color:#b00020">{error}</div>
  {/if}

  {#each tasks as t}
    <div class="task">
      <div class="left">
        {#if editing === t.id}
          <input bind:value={editTitle} style="font-weight:700;width:100%" />
          <textarea bind:value={editDescription} style="width:100%;margin-top:8px"></textarea>
          <div style="margin-top:8px">
            <button on:click={() => saveEdit(t.id)}>Save</button>
            <button on:click={() => (editing = null)}>Cancel</button>
          </div>
        {:else}
          <div style="font-weight:700">{t.title}</div>
          <div class="small">{t.description}</div>
          <div class="small">Status: {t.status} • Total time: {formatSeconds(totalSecondsForTask(t))}</div>
        {/if}
      </div>

      <div class="actions">
        <button on:click={() => startEdit(t)}>Edit</button>
        <button on:click={() => removeTask(t.id)}>Delete</button>
        <button on:click={() => startTracking(t.id)}>Start</button>
        <button on:click={() => stopTracking(t.id)}>Stop</button>
      </div>
    </div>
  {/each}
</div>
