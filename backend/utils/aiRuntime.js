function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function resolveAiConfig(env = process.env) {
  const baseURL = trimTrailingSlash(env.AI_BASE_URL);
  const apiKey = env.AI_API_KEY;
  const modelName = env.AI_MODEL || 'MiniMax-M3';

  if (!baseURL || !apiKey || !modelName) {
    throw new Error('AI config missing: require AI_BASE_URL, AI_API_KEY, AI_MODEL');
  }

  return { baseURL, apiKey, modelName };
}

function isAiEnabled(env = process.env) {
  return env.AI_ENABLED === 'true' && !!env.AI_BASE_URL && !!env.AI_API_KEY;
}

function getOpenAiRuntime(env = process.env) {
  const { generateText, streamText } = require('ai');
  const { createOpenAI } = require('@ai-sdk/openai');
  const { baseURL, apiKey, modelName } = resolveAiConfig(env);
  const openai = createOpenAI({
    baseURL,
    apiKey,
    compatibility: 'compatible',
  });

  return {
    generateText,
    streamText,
    model: openai.chat(modelName),
    modelName,
  };
}

module.exports = {
  getOpenAiRuntime,
  isAiEnabled,
  resolveAiConfig,
};
