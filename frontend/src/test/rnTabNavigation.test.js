import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ native: false, name: 'web' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));

import {
  RN_CONTENT_HUB_DEEP_LINK,
  RN_BUNDLE_SCANNER_DEEP_LINK,
  RN_DEMO_DEEP_LINK,
  RN_FORUM_DETAIL_DEEP_LINK,
  RN_FORUM_LIST_DEEP_LINK,
  RN_PET_DETAIL_DEEP_LINK,
  RN_PREVIEW_ENTRIES,
  RN_STORY_DETAIL_DEEP_LINK,
  RN_STORIES_DEEP_LINK,
  openRnBundleScanner,
  openRnDemoTab,
  openRnPreviewEntry,
  shouldShowRnTab,
} from '../utils/rnTabNavigation';

describe('rnTabNavigation', () => {
  beforeEach(() => {
    platform.native = false;
    platform.name = 'web';
  });

  it('shows the RN tab only inside the native iOS app', () => {
    expect(shouldShowRnTab()).toBe(false);

    platform.native = true;
    platform.name = 'android';
    expect(shouldShowRnTab()).toBe(false);

    platform.native = true;
    platform.name = 'ios';
    expect(shouldShowRnTab()).toBe(true);
  });

  it('opens the RN demo route through the host app deep link', () => {
    const openUrl = vi.fn();

    openRnDemoTab({ openUrl });

    expect(openUrl).toHaveBeenCalledWith(RN_DEMO_DEEP_LINK);
  });

  it('exposes RN app preview entries for the implemented RN pages', () => {
    expect(RN_PREVIEW_ENTRIES).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'RN Demo', url: RN_DEMO_DEEP_LINK }),
      expect.objectContaining({ label: '内容中心', url: RN_CONTENT_HUB_DEEP_LINK }),
      expect.objectContaining({ label: '幸福故事', url: RN_STORIES_DEEP_LINK }),
      expect.objectContaining({ label: '故事详情', url: RN_STORY_DETAIL_DEEP_LINK }),
      expect.objectContaining({ label: '宠物详情', url: RN_PET_DETAIL_DEEP_LINK }),
      expect.objectContaining({ label: '论坛列表', url: RN_FORUM_LIST_DEEP_LINK }),
      expect.objectContaining({ label: '论坛详情', url: RN_FORUM_DETAIL_DEEP_LINK }),
    ]));
  });

  it('opens a selected RN preview entry through its deep link', async () => {
    const openUrl = vi.fn();

    await openRnPreviewEntry(RN_PREVIEW_ENTRIES[1], {
      openUrl,
      buildDeepLink: (url) => url,
    });

    expect(openUrl).toHaveBeenCalledWith(RN_CONTENT_HUB_DEEP_LINK);
  });

  it('wraps selected RN preview entries with authenticated launch params', async () => {
    const openUrl = vi.fn();
    const buildDeepLink = vi.fn(async (url) => `${url}?ticket=ticket-123`);

    await openRnPreviewEntry(
      { label: '论坛详情', url: RN_FORUM_DETAIL_DEEP_LINK },
      { openUrl, buildDeepLink }
    );

    expect(buildDeepLink).toHaveBeenCalledWith(RN_FORUM_DETAIL_DEEP_LINK);
    expect(openUrl).toHaveBeenCalledWith('dogproject://forum/16?ticket=ticket-123');
  });

  it('opens the native QR scanner through the host app deep link', () => {
    const openUrl = vi.fn();

    openRnBundleScanner({ openUrl });

    expect(openUrl).toHaveBeenCalledWith(RN_BUNDLE_SCANNER_DEEP_LINK);
  });
});
