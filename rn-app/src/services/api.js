import { addNetworkLog } from '../debug/debugStore';

function resolveApiBaseUrl() {
  // Pure RN runtime fallback (without Expo globals).
  return 'https://dog-project-6aoq.vercel.app/api';
}

const API_BASE_URL = resolveApiBaseUrl();
const REQUEST_TIMEOUT_MS = 12000;

function authHeaders(token, json = false) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function appendParam(params, key, value) {
  if (value === undefined || value === null || value === '') return;
  params.append(key, String(value));
}

function buildError(payload, status) {
  if (status === 401) {
    const err = new Error('UNAUTHORIZED');
    err.code = 'UNAUTHORIZED';
    return err;
  }
  const message = payload?.error || payload?.message || `Request failed (${status})`;
  const err = new Error(message);
  err.code = 'HTTP_ERROR';
  err.status = status;
  return err;
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  const started = Date.now();
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('REQUEST_TIMEOUT');
      timeoutErr.code = 'REQUEST_TIMEOUT';
      addNetworkLog({ method: options?.method || 'GET', url, status: 'REQUEST_TIMEOUT', durationMs: Date.now() - started });
      throw timeoutErr;
    }
    const networkErr = new Error('NETWORK_ERROR');
    networkErr.code = 'NETWORK_ERROR';
    addNetworkLog({ method: options?.method || 'GET', url, status: 'NETWORK_ERROR', durationMs: Date.now() - started });
    throw networkErr;
  } finally {
    clearTimeout(timeout);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (_err) {
    payload = null;
  }

  addNetworkLog({ method: options?.method || 'GET', url, status: response.status, durationMs: Date.now() - started });
  if (!response.ok) {
    throw buildError(payload, response.status);
  }

  return payload;
}

export async function fetchPetDetails(petId, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/dogs/${petId}`, { headers });
}

export async function fetchDogs() {
  return request('/dogs');
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

export async function fetchForumTopicById(topicId, { token, userId } = {}) {
  const headers = authHeaders(token);
  const query = userId ? `?userId=${encodeURIComponent(String(userId))}` : '';
  const path = `/forum/${encodeURIComponent(String(topicId))}${query}`;
  return request(path, { headers });
}

export async function fetchForumTopics({
  category = 'all',
  sort = 'latest',
  query = '',
  cursor = 0,
  limit = 30,
  userId,
  token,
} = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'all') appendParam(params, 'category', category);
  appendParam(params, 'sort', sort);
  appendParam(params, 'query', query);
  appendParam(params, 'format', 'mcp');
  appendParam(params, 'limit', limit);
  appendParam(params, 'cursor', cursor);
  appendParam(params, 'userId', userId);
  return request(`/forum?${params.toString()}`, { headers: authHeaders(token) });
}

export async function fetchForumContext({
  sort = 'latest',
  category = 'all',
  query = '',
  userId,
  token,
} = {}) {
  const params = new URLSearchParams({
    pageType: 'topic_list',
    route: '/forum',
    sort,
    category,
    query,
  });
  appendParam(params, 'userId', userId);
  return request(`/forum/context?${params.toString()}`, { headers: authHeaders(token) });
}

export async function fetchForumSearchSummary(query, { token, refresh = false } = {}) {
  const params = new URLSearchParams({
    q: String(query || ''),
    timeRange: '180d',
  });
  if (refresh) params.append('_refresh', String(Date.now()));
  return request(`/forum/search/ai-summary?${params.toString()}`, { headers: authHeaders(token) });
}

export async function toggleForumTopicLike(topicId, { token, userId }) {
  return request(`/forum/${encodeURIComponent(String(topicId))}/like`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ userId }),
  });
}

export async function toggleForumAuthorFollow(topicId, { token, userId }) {
  return request(`/forum/${encodeURIComponent(String(topicId))}/follow`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ userId }),
  });
}

export async function fetchForumTopicAiKit(topicId, { token } = {}) {
  return request(`/forum/${encodeURIComponent(String(topicId))}/ai-kit`, {
    headers: authHeaders(token),
  });
}

export async function precheckForumReply({
  topicId,
  content,
  userId,
  replyToCommentId = null,
  replyToUserName,
  token,
}) {
  return request('/forum/precheck/reply', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({
      topicId,
      content,
      userId,
      replyToCommentId,
      replyToUserName,
    }),
  });
}

export async function confirmForumReply({ confirmToken, userId, token }) {
  return request('/forum/confirm/reply', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ confirmToken, userId }),
  });
}

export async function draftForumReply({
  topicId,
  replyToId = null,
  userIntent = '补充经验并给建议',
  tone = 'friendly',
  length = 'medium',
  userId,
  token,
}) {
  return request('/forum/draft-reply', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ topicId, replyToId, userIntent, tone, length, userId }),
  });
}

export async function toggleForumCommentLike(commentId, { token, userId }) {
  return request(`/forum/comments/${encodeURIComponent(String(commentId))}/like`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ userId }),
  });
}

export async function toggleForumReplyLike(replyId, { token, userId }) {
  return request(`/forum/replies/${encodeURIComponent(String(replyId))}/like`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ userId }),
  });
}

export async function deleteForumTopic(topicId, { token, userId }) {
  const params = new URLSearchParams();
  appendParam(params, 'userId', userId);
  return request(`/forum/${encodeURIComponent(String(topicId))}?${params.toString()}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function deleteForumComment(commentId, { token, userId }) {
  const params = new URLSearchParams();
  appendParam(params, 'userId', userId);
  return request(`/forum/comments/${encodeURIComponent(String(commentId))}?${params.toString()}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function deleteForumReply(replyId, { token, userId }) {
  const params = new URLSearchParams();
  appendParam(params, 'userId', userId);
  return request(`/forum/replies/${encodeURIComponent(String(replyId))}?${params.toString()}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function fetchWikiArticles(limit = 4) {
  return request(`/wiki/articles?limit=${encodeURIComponent(String(limit))}`);
}

export async function fetchStories(page = 1, limit = 10) {
  return request(`/stories?page=${encodeURIComponent(String(page))}&limit=${encodeURIComponent(String(limit))}`);
}

export async function fetchStoryById(storyId) {
  return request(`/stories/${encodeURIComponent(String(storyId))}`);
}

export async function toggleStoryLike(storyId, token) {
  if (!token) {
    const err = new Error('NOT_AUTHENTICATED');
    err.code = 'NOT_AUTHENTICATED';
    throw err;
  }
  return request(`/stories/${encodeURIComponent(String(storyId))}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addStoryComment(storyId, content, token) {
  if (!token) {
    const err = new Error('NOT_AUTHENTICATED');
    err.code = 'NOT_AUTHENTICATED';
    throw err;
  }
  return request(`/stories/${encodeURIComponent(String(storyId))}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
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

export async function exchangeMobileTicket(ticket) {
  if (!ticket) {
    const err = new Error('MISSING_TICKET');
    err.code = 'MISSING_TICKET';
    throw err;
  }

  return request('/auth/mobile-ticket/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ticket }),
  });
}

export { API_BASE_URL };
