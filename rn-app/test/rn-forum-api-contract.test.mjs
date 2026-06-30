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

test('RN forum API exposes the H5 forum list and detail capabilities', () => {
  const api = readRepoFile('rn-app/src/services/api.js');

  [
    'fetchForumTopics',
    'fetchForumContext',
    'fetchForumSearchSummary',
    'toggleForumTopicLike',
    'toggleForumAuthorFollow',
    'fetchForumTopicAiKit',
    'precheckForumReply',
    'confirmForumReply',
    'draftForumReply',
    'toggleForumCommentLike',
    'toggleForumReplyLike',
    'deleteForumTopic',
    'deleteForumComment',
    'deleteForumReply',
  ].forEach((fnName) => {
    assert.match(api, new RegExp(`export async function ${fnName}\\b`));
  });

  [
    '/forum?',
    '/forum/context?',
    '/forum/search/ai-summary?',
    '/forum/${encodeURIComponent(String(topicId))}/like',
    '/forum/${encodeURIComponent(String(topicId))}/follow',
    '/forum/${encodeURIComponent(String(topicId))}/ai-kit',
    '/forum/precheck/reply',
    '/forum/confirm/reply',
    '/forum/draft-reply',
    '/forum/comments/${encodeURIComponent(String(commentId))}/like',
    '/forum/replies/${encodeURIComponent(String(replyId))}/like',
  ].forEach((pathSnippet) => {
    assert.ok(api.includes(pathSnippet), `Expected api.js to include ${pathSnippet}`);
  });

  assert.match(api, /method: 'DELETE'/);
  assert.match(api, /Content-Type': 'application\/json'/);
});
