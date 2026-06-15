const FORUM_DETAIL_MODE_KEY = 'forum_detail_debug_mode';

export function getForumDetailMode() {
  return 'h5';
}

export function setForumDetailMode(mode) {
  if (typeof window === 'undefined') return;
  void mode;
  window.localStorage.setItem(FORUM_DETAIL_MODE_KEY, 'h5');
}

export function buildForumRnDeepLink(topicId) {
  return `dogproject://forum/${String(topicId || '').trim()}`;
}

export async function openForumDetailByMode(topicId, navigate, { fallbackToH5 = false } = {}) {
  void fallbackToH5;
  navigate(`/forum/${topicId}`);
}
