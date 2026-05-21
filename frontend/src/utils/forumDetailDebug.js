const FORUM_DETAIL_MODE_KEY = 'forum_detail_debug_mode';

function safeJsonParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

export function getForumDetailMode() {
  if (typeof window === 'undefined') return 'h5';
  const mode = window.localStorage.getItem(FORUM_DETAIL_MODE_KEY);
  return mode === 'rn' ? 'rn' : 'h5';
}

export function setForumDetailMode(mode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FORUM_DETAIL_MODE_KEY, mode === 'rn' ? 'rn' : 'h5');
}

export function buildForumRnDeepLink(topicId) {
  const session = safeJsonParse(window.localStorage.getItem('pawmate_session'));
  const user = safeJsonParse(window.localStorage.getItem('pawmate_user'));
  const token = session?.access_token || '';
  const userId = user?.id || '';

  const wrapped = new URLSearchParams();
  if (token) wrapped.set('token', token);
  if (userId) wrapped.set('userId', userId);

  const query = new URLSearchParams();
  if (wrapped.toString()) {
    query.set('params', wrapped.toString());
  }

  return `dogproject://forum/${topicId}${query.toString() ? `?${query.toString()}` : ''}`;
}

export function openForumDetailByMode(topicId, navigate, { fallbackToH5 = true } = {}) {
  const mode = getForumDetailMode();
  if (mode === 'rn') {
    const deepLink = buildForumRnDeepLink(topicId);
    window.location.href = deepLink;
    if (fallbackToH5) {
      window.setTimeout(() => {
        navigate(`/forum/${topicId}`);
      }, 800);
    }
    return;
  }
  navigate(`/forum/${topicId}`);
}
