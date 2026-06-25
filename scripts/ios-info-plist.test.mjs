import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

const infoPlistPath = new URL('../frontend/ios/App/App/Info.plist', import.meta.url).pathname;

test('iOS host allows React Native StatusBarManager to set status bar style', () => {
  const value = execFileSync(
    'plutil',
    ['-extract', 'UIViewControllerBasedStatusBarAppearance', 'raw', infoPlistPath],
    { encoding: 'utf8' },
  ).trim();

  assert.equal(value, 'false');
});
