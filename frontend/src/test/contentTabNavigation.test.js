import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ native: false, name: 'web' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => platform.native,
    getPlatform: () => platform.name,
  },
}));

import { openContentTab, shouldOpenContentTabInRn } from '../utils/contentTabNavigation';

describe('contentTabNavigation', () => {
  beforeEach(() => {
    platform.native = false;
    platform.name = 'web';
  });

  it('uses the existing H5 route outside native iOS', () => {
    const navigate = vi.fn();

    openContentTab(navigate);

    expect(navigate).toHaveBeenCalledWith('/content');
  });

  it('keeps RN content navigation disabled for the native iOS host', () => {
    platform.native = true;
    platform.name = 'ios';

    expect(shouldOpenContentTabInRn()).toBe(false);

    const navigate = vi.fn();
    openContentTab(navigate);
    expect(navigate).toHaveBeenCalledWith('/content');
  });
});
