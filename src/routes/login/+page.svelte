<script lang="ts">
  import { goto } from '$app/navigation';
  import { setProfile } from '$lib/stores/auth';

  let name = '';
  let password = '';
  let busy = false;
  let error: string | null = null;

  async function submit(e: Event) {
    e.preventDefault();
    error = null;
    busy = true;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      setProfile(json.profile);
      goto('/dashboard/tasks'); // Directly navigate to dashboard
    } catch (err: any) {
      error = err?.message ?? String(err);
    } finally {
      busy = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50">
  <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
    <h2 class="text-2xl font-bold text-gray-800 text-center">Welcome Back</h2>
    <p class="text-gray-500 text-center">Log in to your Task Monitor account</p>

    <form on:submit|preventDefault={submit} class="space-y-4">
      <div>
        <label for="name" class="block font-semibold text-gray-700 mb-1">Name</label>
        <input 
          id="name" 
          bind:value={name} 
          placeholder="Your full name" 
          required
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label for="password" class="block font-semibold text-gray-700 mb-1">Password</label>
        <input 
          id="password" 
          type="password" 
          bind:value={password} 
          placeholder="Your password" 
          required
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {#if error}
        <div class="text-red-600 font-medium text-sm">{error}</div>
      {/if}

      <button 
        type="submit" 
        disabled={busy}
        class="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
    </form>

    <p class="text-gray-500 text-center text-sm">
      Don't have an account? 
      <a href="/signup" class="text-blue-500 hover:underline font-medium">Sign up</a>
    </p>
  </div>
</div>
