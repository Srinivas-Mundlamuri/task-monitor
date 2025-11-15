<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { profile, clearProfile } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let { children } = $props();

  function logout() {
    clearProfile();
    goto('/');
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<!-- Header -->
<header class="bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-10">
  <div class="flex items-center gap-3">
    <img src={favicon} alt="icon" class="w-10 h-10" />
    <a href="/" class="text-2xl font-bold text-gray-800 hover:text-blue-500 transition">Task Monitor</a>
  </div>

  <nav class="flex items-center gap-4">
    {#if $profile}
      <!-- Improved Username Display -->
      <div class="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg shadow-sm">
        <span class="text-gray-600 text-sm">Welcome,</span>
        <span class="font-semibold text-gray-800">{ $profile.name }</span>
      </div>
      <button 
        on:click={logout} 
        class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
      >
        Logout
      </button>
    {:else}
      <a href="/login" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition">Login</a>
      <a href="/signup" class="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition">Sign Up</a>
    {/if}
  </nav>
</header>

<!-- Main Content -->
<main class="min-h-screen bg-gray-50 p-6">
  {@render children()}
</main>
