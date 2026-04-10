import { auth } from './firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authFetch(path: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

export function fetchProfile() {
  return authFetch('/users/me');
}

export function fetchMyRsvps() {
  return authFetch('/users/me/rsvps');
}

export function fetchMyHosted() {
  return authFetch('/users/me/hosted');
}
