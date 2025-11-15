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
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Signup failed');

      setProfile(json.profile); // set profile after signup
      goto('/dashboard/tasks'); // navigate directly to dashboard
    } catch (err: any) {
      error = err?.message ?? String(err);
    } finally {
      busy = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-50">
  <div class="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
    <h2 class="text-2xl font-bold text-gray-800 text-center">Create Your Account</h2>
    <p class="text-gray-500 text-center">Sign up to start tracking your tasks</p>

    <form on:submit|preventDefault={submit} class="space-y-4">
      <div>
        <label for="name" class="block font-semibold text-gray-700 mb-1">Name</label>
        <input 
          id="name" 
          bind:value={name} 
          placeholder="Full name" 
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
          placeholder="Choose a password" 
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
        {busy ? 'Creating…' : 'Create Account'}
      </button>
    </form>

    <p class="text-gray-500 text-center text-sm">
      Already have an account? 
      <a href="/login" class="text-blue-500 hover:underline font-medium">Log in</a>
    </p>
  </div>
</div>
