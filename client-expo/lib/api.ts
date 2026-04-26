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

export function joinActivity(activityId: string) {
  return authFetch(`/activities/${activityId}/rsvp`, {
    method: 'POST',
  });
}

export function fetchMyRsvps() {
  return authFetch('/users/me/rsvps');
}

export function fetchMyHosted() {
  return authFetch('/users/me/hosted');
}

export function endHostedActivity(activityId: string) {
  return authFetch(`/activities/${activityId}/end`, {
    method: 'PATCH',
  });
}

export function cancelHostedActivity(activityId: string) {
  return authFetch(`/activities/${activityId}/cancel`, {
    method: 'POST',
  });
}

export function makeActivityLive(activityId: string) {
  return authFetch(`/activities/${activityId}/live`, {
    method: 'POST',
  });
}

export function leaveRsvp(activityId: string) {
  return authFetch(`/activities/${activityId}/rsvp`, {
    method: 'DELETE',
  });
}

export async function checkInToActivity(activityId: string, latitude: number, longitude: number) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}/activities/${activityId}/rsvp/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

export function hypeActivity(activityId: string) {
  return authFetch(`/activities/${activityId}/hype`, {
    method: 'POST',
  });
}

export function unhypeActivity(activityId: string) {
  return authFetch(`/activities/${activityId}/hype`, {
    method: 'DELETE',
  });
}

export async function fetchHypeStatus(activityId: string) {
  return authFetch(`/activities/${activityId}/hype`);
}

export async function fetchHypeStatuses(activityIds: string[]) {
  const promises = activityIds.map((id) => fetchHypeStatus(id).catch(() => ({ isHyped: false })));
  const results = await Promise.all(promises);
  const statuses: Record<string, boolean> = {};
  activityIds.forEach((id, index) => {
    statuses[id] = results[index].isHyped;
  });
  return statuses;
}

export function searchUsers(query: string) {
  return authFetch(`/friends/search?q=${encodeURIComponent(query)}`);
}

export function sendFriendRequest(userId: string) {
  return authFetch(`/friends/request/${userId}`, {
    method: 'POST',
  });
}

export function acceptFriendRequest(requestId: string) {
  return authFetch(`/friends/accept/${requestId}`, {
    method: 'POST',
  });
}

export function rejectFriendRequest(requestId: string) {
  return authFetch(`/friends/reject/${requestId}`, {
    method: 'POST',
  });
}

export function removeFriend(userId: string) {
  return authFetch(`/friends/${userId}`, {
    method: 'DELETE',
  });
}

export function fetchFriends() {
  return authFetch('/friends');
}

export function fetchIncomingRequests() {
  return authFetch('/friends/requests/incoming');
}

export function fetchOutgoingRequests() {
  return authFetch('/friends/requests/outgoing');
}

export async function fetchActivities(
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  friendsOnly: boolean = false,
) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();

  let url = `${API_URL}/activities`;
  const params = new URLSearchParams();

  if (bounds) {
    params.set('minLat', bounds.minLat.toString());
    params.set('maxLat', bounds.maxLat.toString());
    params.set('minLng', bounds.minLng.toString());
    params.set('maxLng', bounds.maxLng.toString());
  }

  if (friendsOnly) {
    params.set('friendsOnly', 'true');
  }

  if (params.toString()) {
    url += '?' + params.toString();
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}
