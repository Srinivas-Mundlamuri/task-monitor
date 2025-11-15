<script lang="ts">
  import { profile } from '$lib/stores/auth';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';

  const name = "Srinivas Mundlamuri";
  const email = "kotimundlamuri6718@gmail.com"; // replace with your email

  function handleDashboardClick() {
    const user = get(profile);
    if (user) {
      goto('/dashboard/tasks'); // logged-in user → dashboard
    } else {
      goto('/login'); // non-logged-in → login
    }
  }
</script>

<div class="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
  <div class="max-w-3xl text-center bg-white shadow-lg rounded-xl p-10">
    <h1 class="text-4xl font-bold text-gray-800 mb-4">Welcome to Task Monitor</h1>
    <p class="text-gray-600 text-lg mb-6">
      Manage your tasks efficiently, track time spent on each task in real-time, 
      and boost your productivity. Start tracking your workflow today!
    </p>

    <div class="flex justify-center mb-6">
      <button 
        on:click={handleDashboardClick} 
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Go to Dashboard
      </button>
    </div>

    <div class="text-gray-500 text-sm">
      <p>Developed by <span class="font-medium">{name}</span></p>
      <p>Email: <a href="mailto:{email}" class="text-blue-500 hover:underline">{email}</a></p>
    </div>
  </div>
</div>
