import { writable } from 'svelte/store';

export type Profile = { id: string; name: string } | null;

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('profile') : null;

export const profile = writable<Profile>(stored ? JSON.parse(stored) : null);

profile.subscribe((p) => {
  if (typeof localStorage === 'undefined') return;
  if (p === null) localStorage.removeItem('profile');
  else localStorage.setItem('profile', JSON.stringify(p));
});

export function setProfile(p: Profile) {
  profile.set(p);
}

export function clearProfile() {
  profile.set(null);
}

export default { profile, setProfile, clearProfile };
