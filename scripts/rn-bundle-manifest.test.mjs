import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBundleManifest,
  buildBundleManifestDeepLink,
  isSafeLocalBundleUrl,
} from './rn-bundle-manifest.mjs';

describe('rn bundle manifest', () => {
  it('builds a manifest and deep link for an iOS JS bundle', () => {
    const manifest = buildBundleManifest({
      host: '192.168.1.8',
      port: 8787,
      sha256: 'abc123',
      route: 'rn-demo',
    });

    assert.equal(manifest.type, 'dogproject-rn-bundle');
    assert.equal(manifest.platform, 'ios');
    assert.equal(manifest.bundleUrl, 'http://192.168.1.8:8787/main.jsbundle');
    assert.equal(manifest.sha256, 'abc123');
    assert.equal(manifest.route, 'rn-demo');

    assert.equal(
      buildBundleManifestDeepLink(manifest),
      'dogproject://rn-bundle?manifest=http%3A%2F%2F192.168.1.8%3A8787%2Frn-bundle-manifest.json'
    );
  });

  it('allows only local-network bundle URLs during development', () => {
    assert.equal(isSafeLocalBundleUrl('http://127.0.0.1:8787/main.jsbundle'), true);
    assert.equal(isSafeLocalBundleUrl('http://192.168.1.8:8787/main.jsbundle'), true);
    assert.equal(isSafeLocalBundleUrl('http://10.0.0.12:8787/main.jsbundle'), true);
    assert.equal(isSafeLocalBundleUrl('https://example.com/main.jsbundle'), false);
    assert.equal(isSafeLocalBundleUrl('file:///tmp/main.jsbundle'), false);
  });
});
