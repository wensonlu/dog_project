import { buildRnPilotPlainDeepLink } from './rnDeepLink';

const FORUM_DETAIL_MODE_KEY = 'forum_detail_debug_mode';

export function getForumDetailMode() {
  if (typeof window === 'undefined') return 'rn';
  const mode = window.localStorage.getItem(FORUM_DETAIL_MODE_KEY);
  if (mode === 'h5') return 'h5';
  if (mode === 'rn') return 'rn';
  return 'rn';
}

export function setForumDetailMode(mode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FORUM_DETAIL_MODE_KEY, mode === 'rn' ? 'rn' : 'h5');
}

export function buildForumRnDeepLink(topicId) {
  return buildRnPilotPlainDeepLink('forum', topicId);
}

export async function openForumDetailByMode(topicId, navigate, { fallbackToH5 = false } = {}) {
  const mode = getForumDetailMode();
  if (mode === 'rn') {
    let fallbackTimer = null;
    if (fallbackToH5) {
      fallbackTimer = window.setTimeout(() => {
        navigate(`/forum/${topicId}`);
      }, 900);
    }
    const deepLink = buildForumRnDeepLink(topicId);
    window.location.href = deepLink;
    if (fallbackTimer) {
      window.setTimeout(() => {
        window.clearTimeout(fallbackTimer);
      }, 1200);
    }
    return;
  }
  navigate(`/forum/${topicId}`);
}
