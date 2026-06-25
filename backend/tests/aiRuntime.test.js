const test = require('node:test');
const assert = require('node:assert/strict');

const { isAiEnabled, resolveAiConfig } = require('../utils/aiRuntime');

test('resolveAiConfig normalizes OpenAI-compatible provider settings', () => {
  const config = resolveAiConfig({
    AI_BASE_URL: 'https://api.minimax.io/v1/',
    AI_API_KEY: 'secret-key',
    AI_MODEL: 'MiniMax-M3',
  });

  assert.equal(config.baseURL, 'https://api.minimax.io/v1');
  assert.equal(config.apiKey, 'secret-key');
  assert.equal(config.modelName, 'MiniMax-M3');
});

test('isAiEnabled requires explicit enable flag and provider credentials', () => {
  assert.equal(isAiEnabled({
    AI_ENABLED: 'true',
    AI_BASE_URL: 'https://api.minimax.io/v1',
    AI_API_KEY: 'secret-key',
  }), true);

  assert.equal(isAiEnabled({
    AI_BASE_URL: 'https://api.minimax.io/v1',
    AI_API_KEY: 'secret-key',
  }), false);
});
