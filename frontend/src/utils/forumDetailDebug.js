import { buildRnPilotDeepLink, buildRnPilotDeepLinkWithTicket } from './rnDeepLink';

const FORUM_DETAIL_MODE_KEY = 'forum_detail_debug_mode';

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
  return buildRnPilotDeepLink('forum', topicId, { wrapParams: true });
}

export async function openForumDetailByMode(topicId, navigate, { fallbackToH5 = true } = {}) {
  const mode = getForumDetailMode();
  if (mode === 'rn') {
    const deepLink = await buildRnPilotDeepLinkWithTicket('forum', topicId);
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
