const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, options);

  let payload = null;
  try {
    payload = await response.json();
  } catch (_err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchPetDetails(petId, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/dogs/${petId}`, { headers });
}

export async function togglePetFavorite(petId, token) {
  if (!token) {
    throw new Error('NOT_AUTHENTICATED');
  }

  return request(`/favorites/${petId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}

export { API_BASE_URL };
