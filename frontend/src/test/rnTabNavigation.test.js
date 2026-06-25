import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ native: false, name: 'web' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));

import {
  RN_BUNDLE_SCANNER_DEEP_LINK,
  RN_DEMO_DEEP_LINK,
  openRnBundleScanner,
  openRnDemoTab,
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

  it('opens the native QR scanner through the host app deep link', () => {
    const openUrl = vi.fn();

    openRnBundleScanner({ openUrl });

    expect(openUrl).toHaveBeenCalledWith(RN_BUNDLE_SCANNER_DEEP_LINK);
  });
});
