import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '../..');

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('iOS RN host moduleName is registered by the RN entrypoint', () => {
  const hostManager = readRepoFile('frontend/ios/App/App/RNHostManager.swift');
  const entrypoint = readRepoFile('rn-app/index.js');

  const moduleName = hostManager.match(/moduleName:\s*"([^"]+)"/)?.[1];
  const registeredNames = Array.from(
    entrypoint.matchAll(/AppRegistry\.registerComponent\(\s*['"]([^'"]+)['"]/g),
    (match) => match[1]
  );

  assert.ok(moduleName, 'Expected RNHostManager.swift to declare an RCTRootView moduleName');
  assert.ok(
    registeredNames.includes(moduleName),
    `Expected RN entrypoint to register "${moduleName}", got: ${registeredNames.join(', ') || '(none)'}`
  );
});

test('RN app persists launch auth before rendering a routed page', () => {
  const app = readRepoFile('rn-app/App.js');

  assert.ok(app.includes('persistAuthFromPayload'), 'Expected App.js to centralize launch auth persistence');
  assert.ok(app.includes('exchangeMobileTicket(payload.ticket)'), 'Expected ticket exchange before routed RN pages use auth');

  const applyLaunchStart = app.indexOf('async function applyLaunchUrl');
  const persistInApplyLaunch = app.indexOf('await persistAuthFromPayload(payload);', applyLaunchStart);
  const routeInApplyLaunch = app.indexOf('applyRoutePayload(url, payload);', applyLaunchStart);
  assert.ok(
    persistInApplyLaunch > applyLaunchStart && persistInApplyLaunch < routeInApplyLaunch,
    'Expected initial deep link auth to persist before applyRoutePayload renders the screen'
  );

  const openRnRouteStart = app.indexOf('const openRnRoute');
  const persistInOpenRoute = app.indexOf('await persistAuthFromPayload(payload);', openRnRouteStart);
  const routeInOpenRoute = app.indexOf('applyRoutePayload(url, payload, options);', openRnRouteStart);
  assert.ok(
    persistInOpenRoute > openRnRouteStart && persistInOpenRoute < routeInOpenRoute,
    'Expected in-RN route launches to persist auth before rendering the screen'
  );
});
