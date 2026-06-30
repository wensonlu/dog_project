import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const entriesPath = join(
  process.cwd(),
  'rn-app',
  'src',
  'navigation',
  'rnDemoEntries.json'
);

function loadEntries() {
  return JSON.parse(readFileSync(entriesPath, 'utf8'));
}

describe('rn demo page entries', () => {
  it('exposes every RN page from the RN tab demo screen', () => {
    const entries = loadEntries();
    const expected = [
      {
        key: 'rn-demo',
        title: 'RN Demo Tab',
        routeType: 'demo',
        screen: 'RnDemoScreen',
        launchUrl: 'dogproject://rn-demo',
      },
      {
        key: 'pet-details',
        title: '宠物详情',
        routeType: 'pet',
        screen: 'PetDetailsScreen',
        launchUrl: 'dogproject://pet/1',
      },
      {
        key: 'forum-list',
        title: '论坛列表',
        routeType: 'forum-list',
        screen: 'ForumListScreen',
        launchUrl: 'dogproject://forum',
      },
      {
        key: 'forum-detail',
        title: '帖子详情',
        routeType: 'forum',
        screen: 'ForumDetailScreen',
        launchUrl: 'dogproject://forum/16',
      },
      {
        key: 'content-hub',
        title: '内容中心',
        routeType: 'content',
        screen: 'ContentHubScreen',
        launchUrl: 'dogproject://content',
      },
      {
        key: 'stories',
        title: '幸福故事',
        routeType: 'stories',
        screen: 'StoriesScreen',
        launchUrl: 'dogproject://stories',
      },
      {
        key: 'story-detail',
        title: '故事详情',
        routeType: 'story',
        screen: 'StoryDetailScreen',
        launchUrl: 'dogproject://story/1',
      },
    ];

    assert.deepEqual(
      entries.map(({ key, title, routeType, screen, launchUrl }) => ({
        key,
        title,
        routeType,
        screen,
        launchUrl,
      })),
      expected
    );
  });

  it('keeps entry ids and launch URLs unique', () => {
    const entries = loadEntries();

    assert.equal(entries.length, 7);
    assert.equal(new Set(entries.map((entry) => entry.key)).size, entries.length);
    assert.equal(new Set(entries.map((entry) => entry.routeType)).size, entries.length);
    assert.equal(new Set(entries.map((entry) => entry.launchUrl)).size, entries.length);

    entries.forEach((entry) => {
      assert.match(entry.launchUrl, /^dogproject:\/\//);
      assert.equal(typeof entry.description, 'string');
      assert.ok(entry.description.length > 0);
    });
  });
});
