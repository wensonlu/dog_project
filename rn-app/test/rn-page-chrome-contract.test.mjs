import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '../..');

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readRepoFile(relativePath) {
  return readFileSync(repoPath(relativePath), 'utf8');
}

function listJsFiles(dir) {
  return readdirSync(repoPath(dir), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(relativePath);
    return entry.isFile() && entry.name.endsWith('.js') ? [relativePath] : [];
  });
}

test('RN app renders every route inside the shared page shell', () => {
  const app = readRepoFile('rn-app/App.js');

  assert.match(app, /import RnPageShell from '\.\/src\/components\/RnPageShell';/);
  assert.match(app, /<RnPageShell\b/);
  assert.match(app, /onBack=\{handleRouteBack\}/);
  assert.doesNotMatch(app, /\bactiveTab=/);
  assert.doesNotMatch(app, /onOpenStoriesHome=/);

  ['demo', 'content', 'stories', 'story', 'forum-list', 'forum', 'pet'].forEach((routeType) => {
    assert.match(
      app,
      new RegExp(`route\\.type === '${routeType}'|case '${routeType}'|type: '${routeType}'`),
      `Expected App.js to keep ${routeType} in the shared RN route surface`
    );
  });
});

test('shared RN page shell owns only the common back action', () => {
  const shellPath = 'rn-app/src/components/RnPageShell.js';
  assert.ok(existsSync(repoPath(shellPath)), 'Expected a shared RnPageShell component');

  const shell = readRepoFile(shellPath);
  assert.doesNotMatch(shell, /HybridBottomNav/);
  assert.match(shell, /accessibilityLabel="返回"/);
  assert.match(shell, /onBack/);
});

test('RN pages do not render the public H5 bottom tab', () => {
  const owners = listJsFiles('rn-app/src')
    .filter((file) => file !== 'rn-app/src/components/HybridBottomNav.js')
    .filter((file) => readRepoFile(file).includes('HybridBottomNav'));

  assert.deepEqual(owners, []);

  [
    'rn-app/src/screens/ContentHubScreen.js',
    'rn-app/src/screens/StoriesScreen.js',
    'rn-app/src/screens/StoryDetailScreen.js',
    'rn-app/src/screens/ForumListScreen.js',
    'rn-app/src/screens/PetDetailsScreen.js',
    'rn-app/src/screens/ForumDetailScreen.js',
  ].forEach((screenPath) => {
    const source = readRepoFile(screenPath);
    assert.doesNotMatch(source, /\bonBack\b/, `${screenPath} should receive back from RnPageShell`);
  });
});

test('RN forum routes separate list and detail payloads', () => {
  const app = readRepoFile('rn-app/App.js');
  const linking = readRepoFile('rn-app/src/navigation/linking.js');

  assert.match(app, /payload\?\.routeType === 'forum' && !payload\?\.topicId/);
  assert.match(app, /setRoute\(\{ type: 'forum-list'/);
  assert.match(app, /<ForumListScreen\b/);
  assert.match(linking, /buildForumListUrl/);
  assert.match(linking, /dogproject:\/\/forum/);
});

test('RN demo pet detail entry is backed by loaded pet data', () => {
  const demo = readRepoFile('rn-app/src/screens/RnDemoScreen.js');

  assert.match(demo, /fetchDogs/);
  assert.match(demo, /entry\.key === 'pet-details'/);
  assert.match(demo, /disabled: !firstPetId/);
  assert.match(demo, /dogproject:\/\/pet\/\$\{firstPetId\}/);
});
