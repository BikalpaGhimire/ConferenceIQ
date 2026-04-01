const API_BASE = '/api';

export async function registerUser(pin, name, profile) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, name, profile }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }

  return res.json();
}

export async function loginUser(pin) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }

  return res.json();
}

export async function syncToServer(userId, data) {
  const res = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...data }),
  });

  if (!res.ok) {
    console.warn('Sync failed');
  }
}

// Debounced sync — call this after any state change
let syncTimer = null;
export function debouncedSync(userId, data) {
  if (!userId) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToServer(userId, data), 2000);
}
