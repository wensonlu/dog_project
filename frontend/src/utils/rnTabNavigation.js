import { Capacitor } from '@capacitor/core';
import { buildAuthenticatedRnDeepLink } from './rnDeepLink';

export const RN_DEMO_DEEP_LINK = 'dogproject://rn-demo';
export const RN_BUNDLE_SCANNER_DEEP_LINK = 'dogproject://rn-scan-bundle';
export const RN_CONTENT_HUB_DEEP_LINK = 'dogproject://content';
export const RN_STORIES_DEEP_LINK = 'dogproject://stories';
export const RN_STORY_DETAIL_DEEP_LINK = 'dogproject://story/1';
export const RN_PET_DETAIL_DEEP_LINK = 'dogproject://pet/1';
export const RN_FORUM_LIST_DEEP_LINK = 'dogproject://forum';
export const RN_FORUM_DETAIL_DEEP_LINK = 'dogproject://forum/16';

export const RN_PREVIEW_ENTRIES = [
  {
    label: 'RN Demo',
    icon: 'developer_mode',
    description: '容器与调试参数',
    url: RN_DEMO_DEEP_LINK,
  },
  {
    label: '内容中心',
    icon: 'dashboard',
    description: '百科与故事聚合页',
    url: RN_CONTENT_HUB_DEEP_LINK,
  },
  {
    label: '幸福故事',
    icon: 'auto_stories',
    description: '故事列表页',
    url: RN_STORIES_DEEP_LINK,
  },
  {
    label: '故事详情',
    icon: 'article',
    description: '默认故事 ID 1',
    url: RN_STORY_DETAIL_DEEP_LINK,
  },
  {
    label: '宠物详情',
    icon: 'pets',
    description: '默认宠物 ID 1',
    url: RN_PET_DETAIL_DEEP_LINK,
  },
  {
    label: '论坛列表',
    icon: 'view_column',
    description: '社区瀑布流帖子列表',
    url: RN_FORUM_LIST_DEEP_LINK,
  },
  {
    label: '论坛详情',
    icon: 'forum',
    description: '默认帖子 ID 16',
    url: RN_FORUM_DETAIL_DEEP_LINK,
  },
];

function defaultOpenUrl(url) {
  if (typeof window === 'undefined') return;
  window.location.href = url;
}

export function shouldShowRnTab() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

export function openRnDemoTab({ openUrl = defaultOpenUrl } = {}) {
  openUrl(RN_DEMO_DEEP_LINK);
}

export async function openRnPreviewEntry(entry, {
  openUrl = defaultOpenUrl,
  buildDeepLink = buildAuthenticatedRnDeepLink,
} = {}) {
  const url = typeof entry === 'string' ? entry : entry?.url;
  if (!url) return;
  const launchUrl = await buildDeepLink(url);
  openUrl(launchUrl);
}

export function buildPetDetailDeepLink(petId) {
  const normalizedId = String(petId || '').trim();
  return normalizedId ? `dogproject://pet/${encodeURIComponent(normalizedId)}` : RN_PET_DETAIL_DEEP_LINK;
}

export function openRnBundleScanner({ openUrl = defaultOpenUrl } = {}) {
  openUrl(RN_BUNDLE_SCANNER_DEEP_LINK);
}
