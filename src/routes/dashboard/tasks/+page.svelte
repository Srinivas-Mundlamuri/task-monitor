<script lang="ts">
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';
  import { get } from 'svelte/store';

  type TimeLog = { id: string; start_time: string; end_time?: string; duration?: string };
  type Task = { 
    id: string; 
    title: string; 
    description?: string; 
    status: string; 
    time_logs?: TimeLog[];
  };

  let tasks: Task[] = [];
  let loading = false;
  let name = '';
  let description = '';
  let error: string | null = null;

  let editing: string | null = null;
  let editTitle = '';
  let editDescription = '';
  let statusOptions = ['Pending', 'In Progress', 'Completed'];

  function userId() {
    return get(profile)?.id ?? null;
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

  function totalSecondsForTask(t: Task) {
    if (!t.time_logs) return 0;
    return t.time_logs.reduce((acc, l) => {
      let seconds = 0;
      if (l.duration) {
        const parts = l.duration.split(':').map(Number);
        if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
      } else if (l.start_time && l.end_time) {
        seconds = Math.floor((new Date(l.end_time).getTime() - new Date(l.start_time).getTime())/1000);
      }
      return acc + seconds;
    }, 0);
  }

  // Format Date into readable time
function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Format duration in seconds into HH:MM:SS
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Convert raw log duration (ms or HH:MM:SS) into seconds
function logDurationInSeconds(log: TimeLog) {
  if (log.duration) {
    // If duration exists in HH:MM:SS format
    const parts = log.duration.split(':').map(Number);
    return parts[0]*3600 + parts[1]*60 + parts[2];
  } else if (log.start_time && log.end_time) {
    return Math.floor((new Date(log.end_time).getTime() - new Date(log.start_time).getTime())/1000);
  } else {
    return Math.floor((Date.now() - new Date(log.start_time).getTime())/1000); // running log
  }
}
function isLogToday(log: TimeLog) {
  const start = new Date(log.start_time);
  const end = log.end_time ? new Date(log.end_time) : new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // today 00:00:00
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); // today 23:59:59

  // return true if log overlaps today
  return (start <= todayEnd && end >= todayStart);
}



  async function createTask() {
    const uid = userId();
    if (!uid) return;
    const res = await fetch(`/api/tasks`, {
      method: 'POST',
      headers: { 'x-user-id': uid, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: name, description })
    });
    const json = await res.json();
    if (!res.ok) { error = json.error; return; }
    tasks = [json.task, ...tasks];
    name = '';
    description = '';
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
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: editTitle, description: editDescription })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks[idx] = json.task;
      editing = null;
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const uid = userId();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (uid) headers['x-user-id'] = uid;
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Status update failed');
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks[idx].status = status;
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
  }

  async function deleteTask(id: string) {
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

  async function startTracking(taskId: string) {
    const uid = userId();
    const res = await fetch(`/api/tasks/${taskId}/start`, { method: 'POST', headers: { 'x-user-id': uid } });
    const json = await res.json();
    if (!res.ok) { error = json.error; return; }
    await load();
  }

  async function stopTracking(taskId: string) {
    const uid = userId();
    const res = await fetch(`/api/tasks/${taskId}/stop`, { method: 'POST', headers: { 'x-user-id': uid } });
    const json = await res.json();
    if (!res.ok) { error = json.error; return; }
    await load();
  }

  onMount(() => {
    if (!userId()) {
      error = 'Please log in to view tasks';
      return;
    }
    load();
  });
</script>

<div class="max-w-5xl mx-auto p-6">
  <!-- Header with Navigation -->
  <div class="flex flex-col md:flex-row justify-between items-center mb-6">
    <h2 class="text-3xl font-bold text-gray-800 mb-4 md:mb-0">📝 Task Tracker</h2>
    <a 
      href="/dashboard/summary" 
      class="px-6 py-3 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
      Go to Daily Summary
    </a>
  </div>

  <!-- Create Task -->
  <div class="flex flex-col md:flex-row gap-3 mb-6">
    <input placeholder="Task title" bind:value={name} class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
    <input placeholder="Description" bind:value={description} class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
    <button on:click={createTask} class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Create</button>
  </div>

  {#if loading}
    <div class="text-gray-500 animate-pulse">Loading…</div>
  {/if}
  {#if error}
    <div class="text-red-500 font-medium mb-4">{error}</div>
  {/if}

  <div class="space-y-4">
    {#each tasks as t}
      <div class="bg-white shadow-lg rounded-xl p-4 border border-gray-200 hover:shadow-2xl transition">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div class="flex-1">
            {#if editing === t.id}
              <input bind:value={editTitle} class="w-full font-semibold px-2 py-1 border rounded-md mb-2" />
              <textarea bind:value={editDescription} class="w-full px-2 py-1 border rounded-md mb-2"></textarea>
              <div class="flex gap-2 mb-2">
                <button on:click={() => saveEdit(t.id)} class="px-4 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">Save</button>
                <button on:click={() => (editing=null)} class="px-4 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition">Cancel</button>
              </div>
            {:else}
              <h3 class="text-lg font-semibold text-gray-700">{t.title}</h3>
              <p class="text-gray-500 text-sm">{t.description}</p>
            {/if}
            <p class="text-gray-600 mt-2">
              Status:
              <select bind:value={t.status} on:change={(e)=>updateStatus(t.id, t.status)} class="border px-2 py-1 rounded-md">
                {#each statusOptions as s}<option value={s}>{s}</option>{/each}
              </select>
              • Total Time: <span class="font-medium">{formatDuration(totalSecondsForTask(t))}</span>
            </p>
          </div>

          <div class="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
            {#if editing !== t.id}
              <button on:click={() => startEdit(t)} class="px-4 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">Edit</button>
            {/if}
            <button on:click={() => deleteTask(t.id)} class="px-4 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Delete</button>
            <button on:click={() => startTracking(t.id)} class="px-4 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">Start</button>
            <button on:click={() => stopTracking(t.id)} class="px-4 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">Stop</button>
          </div>
        </div>

        {#if t.time_logs && t.time_logs.length > 0}
        <div class="mt-3">
            <h4 class="text-sm font-semibold text-gray-600 mb-1">Time Logs:</h4>
            <ul class="space-y-1 text-gray-500 text-sm">
            {#each t.time_logs as log}
                <li class="flex justify-between">
                <span>
                    {formatTime(log.start_time)} → {log.end_time ? formatTime(log.end_time) : 'Running'}
                </span>
                <span class="font-medium">{formatDuration(logDurationInSeconds(log))}</span>
                </li>
            {/each}
            </ul>
        </div>
        {/if}

      </div>
    {/each}
  </div>
</div>
