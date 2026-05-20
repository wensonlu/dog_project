const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

function buildError(payload, status) {
  const message = payload?.error || payload?.message || `Request failed (${status})`;
  return new Error(message);
}

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
    throw buildError(payload, response.status);
  }

  return payload;
}

export async function fetchPetDetails(petId, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/dogs/${petId}`, { headers });
}

export async function fetchRelatedTopics(petId, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/forum/related/${petId}`, { headers });
}

export async function fetchReviews(petId, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/reviews/${petId}`, { headers });
}

export async function fetchReviewEligibility(petId, token) {
  if (!token) return { eligible: false, reason: 'not_logged_in' };
  const headers = { Authorization: `Bearer ${token}` };
  return request(`/reviews/check-eligibility/${petId}`, { headers });
}

export async function togglePetFavorite(petId, { token, userId }) {
  if (!token || !userId) {
    throw new Error('NOT_AUTHENTICATED');
  }

  return request('/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
      dogId: Number(petId),
    }),
  });
}

export { API_BASE_URL };
