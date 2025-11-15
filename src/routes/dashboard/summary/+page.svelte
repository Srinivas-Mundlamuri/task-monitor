<script lang="ts">
  import { onMount } from 'svelte';
  import { profile } from '$lib/stores/auth';
  import { get } from 'svelte/store';

  type TimeLog = { id: string; start_time: string; end_time?: string; duration?: string };
  type Task = { id: string; title: string; description?: string; status: string; time_logs?: TimeLog[] };

  let tasks: Task[] = [];
  let loading = false;
  let error: string | null = null;

  function userId() {
    return get(profile)?.id ?? null;
  }

  function totalSecondsForToday(t: Task) {
    if (!t.time_logs) return 0;
    const today = new Date().toDateString();
    return t.time_logs.reduce((acc, log) => {
      const start = new Date(log.start_time);
      const end = log.end_time ? new Date(log.end_time) : new Date();
      if (start.toDateString() !== today) return acc;
      const seconds = log.duration
        ? log.duration.split(':').map(Number).reduce((h, v, i) => h + v * [3600, 60, 1][i], 0)
        : Math.floor((end.getTime() - start.getTime()) / 1000);
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

  async function loadTasks() {
    const uid = userId();
    if (!uid) {
      error = 'Please log in to view summary';
      return;
    }

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

  onMount(() => loadTasks());

  // Summary stats
  $: todayTasks = tasks.filter(t => t.time_logs?.some(l => new Date(l.start_time).toDateString() === new Date().toDateString()));
  $: completedTasks = tasks.filter(t => t.status === 'Completed');
  $: pendingTasks = tasks.filter(t => t.status !== 'Completed');
  $: totalTimeToday = todayTasks.reduce((acc, t) => acc + totalSecondsForToday(t), 0);
</script>
=
<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-5xl mx-auto">
    <!-- Header with navigation -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-8">
      <h2 class="text-3xl font-bold text-gray-800 mb-4 md:mb-0">📊 Daily Summary</h2>
      <a 
        href="/dashboard/tasks" 
        class="px-6 py-3 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition flex items-center gap-2"
      >
        <!-- Optional icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        Go to Tasks Dashboard
      </a>
    </div>

    {#if loading}
      <div class="text-gray-500 animate-pulse text-center text-lg">Loading…</div>
    {/if}

    {#if error}
      <div class="text-red-600 font-medium mb-4 text-center">{error}</div>
    {/if}

    {#if !loading && !error}
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200 flex flex-col items-center">
          <h3 class="text-gray-600 font-semibold text-lg mb-2">Tasks Today</h3>
          <p class="text-3xl font-bold text-blue-600">{todayTasks.length}</p>
        </div>
        <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200 flex flex-col items-center">
          <h3 class="text-gray-600 font-semibold text-lg mb-2">Total Time Tracked</h3>
          <p class="text-3xl font-bold text-blue-600">{formatDuration(totalTimeToday)}</p>
        </div>
        <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200 flex flex-col items-center">
          <h3 class="text-gray-600 font-semibold text-lg mb-2">Completed Tasks</h3>
          <p class="text-3xl font-bold text-green-600">{completedTasks.length}</p>
        </div>
      </div>

      <!-- Pending Tasks -->
      <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200 mb-8">
        <h3 class="text-gray-700 font-semibold text-xl mb-4">Pending / In Progress Tasks</h3>
        <ul class="divide-y divide-gray-200">
          {#each pendingTasks as t}
            <li class="flex justify-between py-3 hover:bg-gray-50 rounded-lg px-2 transition">
              <span class="font-medium text-gray-800">{t.title}</span>
              <span class="text-sm text-gray-500 capitalize">{t.status}</span>
            </li>
          {/each}
        </ul>
      </div>

     <!-- Time Logs Today -->
    <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
    <h3 class="text-gray-700 font-semibold text-xl mb-4">⏱ Time Logs Today</h3>
    <ul class="divide-y divide-gray-100">
        {#each todayTasks as t}
        {#each t.time_logs.filter(l => new Date(l.start_time).toDateString() === new Date().toDateString()) as log}
            <li class="py-2 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 transition">
            <!-- Task Title -->
            <span class="font-medium text-gray-800">{t.title}</span>

            <!-- Start → End & Duration -->
            <span class="text-gray-500 text-sm">
                {formatTime(log.start_time)} → {log.end_time ? formatTime(log.end_time) : 'Running'} 
                ({formatDuration(logDurationInSeconds(log))})
            </span>
            </li>
        {/each}
        {/each}
    </ul>
    </div>

    {/if}
  </div>
</div>
