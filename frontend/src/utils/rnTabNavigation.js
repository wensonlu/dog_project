import { Capacitor } from '@capacitor/core';

export const RN_DEMO_DEEP_LINK = 'dogproject://rn-demo';
export const RN_BUNDLE_SCANNER_DEEP_LINK = 'dogproject://rn-scan-bundle';

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

export function openRnBundleScanner({ openUrl = defaultOpenUrl } = {}) {
  openUrl(RN_BUNDLE_SCANNER_DEEP_LINK);
}
