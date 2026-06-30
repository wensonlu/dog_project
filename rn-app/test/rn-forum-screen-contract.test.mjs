import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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

test('RN forum list implements H5 forum list primary workflows', () => {
  const screenPath = 'rn-app/src/screens/ForumListScreen.js';
  assert.ok(existsSync(repoPath(screenPath)), 'Expected ForumListScreen.js');

  const screen = readRepoFile(screenPath);

  [
    'fetchForumTopics',
    'fetchForumContext',
    'fetchForumSearchSummary',
    'RefreshControl',
    'TextInput',
    'selectedCategory',
    'selectedSort',
    'searchInput',
    'aiSummary',
    'onOpenTopic',
    'onOpenWeb',
    "'/forum/create'",
    "'/forum/history'",
    'waterfallColumns',
    'waterfallGrid',
    'waterfallColumn',
    'topicImageTall',
    'topicImageShort',
  ].forEach((snippet) => {
    assert.ok(screen.includes(snippet), `Expected ForumListScreen to include ${snippet}`);
  });

  ['latest', 'hot', 'comments', 'all', 'adoption', 'daily', 'question'].forEach((token) => {
    assert.match(screen, new RegExp(token));
  });
});

test('RN forum detail implements H5 forum detail primary actions', () => {
  const screen = readRepoFile('rn-app/src/screens/ForumDetailScreen.js');

  [
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
    'TextInput',
    'KeyboardAvoidingView',
    'Keyboard.addListener',
    'keyboardDidShow',
    'scrollViewRef',
    'composerInputRef',
    'scrollToEnd',
    'keyboardComposer',
    'composerKeyboardLift',
    'keyboardHeight',
    'keyboardWillShow',
    'keyboardWillHide',
    'position: \'absolute\'',
    'bottom: composerKeyboardLift',
    'Platform.OS',
    'onOpenWeb',
    "'/shop/order?",
    'Share.share',
    'AI草拟',
    '去下单',
    '关注',
    '删除',
    '回复',
  ].forEach((snippet) => {
    assert.ok(screen.includes(snippet), `Expected ForumDetailScreen to include ${snippet}`);
  });
});
