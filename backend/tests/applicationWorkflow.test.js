const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRejectReasonCodes,
  buildApplicationTimeline,
  calculateProfileCompletion,
  buildRejectionMessage,
} = require('../utils/applicationWorkflow');

test('normalizeRejectReasonCodes keeps unique non-empty codes', () => {
  assert.deepEqual(
    normalizeRejectReasonCodes(['housing_not_suitable', '', 'other', 'housing_not_suitable', null]),
    ['housing_not_suitable', 'other']
  );
});

test('buildApplicationTimeline includes submission and rejection detail', () => {
  const timeline = buildApplicationTimeline({
    id: 42,
    status: 'rejected',
    created_at: '2026-04-17T01:00:00.000Z',
    reviewed_at: '2026-04-17T03:00:00.000Z',
    reject_reason_codes: ['housing_not_suitable', 'profile_incomplete'],
    reject_note: '建议先补充居住信息',
  });

  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].type, 'submitted');
  assert.equal(timeline[1].type, 'rejected');
  assert.deepEqual(timeline[1].meta.rejectReasonCodes, ['housing_not_suitable', 'profile_incomplete']);
  assert.equal(timeline[1].meta.rejectNote, '建议先补充居住信息');
});

test('calculateProfileCompletion reports percentage and missing fields', () => {
  const result = calculateProfileCompletion({
    full_name: 'Alice',
    avatar_url: '',
    bio: 'Loves dogs',
    phone: null,
  });

  assert.equal(result.completedFields, 2);
  assert.equal(result.totalFields, 4);
  assert.equal(result.percentage, 50);
  assert.deepEqual(result.missingFields, ['avatar_url', 'phone']);
  assert.equal(result.isComplete, false);
});

test('buildRejectionMessage includes reasons and note', () => {
  const message = buildRejectionMessage('Lucky', ['housing_not_suitable', 'other'], '欢迎完善资料后再申请');

  assert.match(message, /Lucky/);
  assert.match(message, /居住条件暂不匹配/);
  assert.match(message, /其他原因/);
  assert.match(message, /欢迎完善资料后再申请/);
});
