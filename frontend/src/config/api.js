import { Capacitor } from '@capacitor/core';
import { resolveApiBaseUrl } from './apiBaseUrl';

/**
 * API 配置
 * 开发模式：使用 http://localhost:5001/api
 * 生产模式：优先使用 VITE_API_URL；CloudBase/自定义域默认同源 /api；
 * Vercel 域名回落到稳定后端域名，避免旧部署缺少环境变量时失效。
 */
function getApiBaseUrl() {
    return resolveApiBaseUrl({
        envApiUrl: import.meta.env.VITE_API_URL,
        isDev: import.meta.env.DEV,
        isNative: Capacitor.isNativePlatform(),
        hostname: window.location.hostname,
    });
}

export const API_BASE_URL = getApiBaseUrl();

export const CHAT_API = {
  CREATE_SESSION: `${API_BASE_URL}/chat/sessions`,
  SEND_MESSAGE: `${API_BASE_URL}/chat/messages`,
  REGENERATE_MESSAGE: `${API_BASE_URL}/chat/messages/regenerate`,
  GET_SESSION: (sessionId) => `${API_BASE_URL}/chat/sessions/${sessionId}`,
  DELETE_SESSION: (sessionId) => `${API_BASE_URL}/chat/sessions/${sessionId}`
};

export const FORUM_API = {
  LIST: `${API_BASE_URL}/forum`,
  CONTEXT: `${API_BASE_URL}/forum/context`,
  SEARCH_AI_SUMMARY: `${API_BASE_URL}/forum/search/ai-summary`,
  RELATED_TOPICS: `${API_BASE_URL}/forum/related-topics`,
  DRAFT_REPLY: `${API_BASE_URL}/forum/draft-reply`,
  DRAFT_TOPIC: `${API_BASE_URL}/forum/draft-topic`,
  PRECHECK_TOPIC: `${API_BASE_URL}/forum/precheck/topic`,
  CONFIRM_TOPIC: `${API_BASE_URL}/forum/confirm/topic`,
  PRECHECK_REPLY: `${API_BASE_URL}/forum/precheck/reply`,
  CONFIRM_REPLY: `${API_BASE_URL}/forum/confirm/reply`,
  VERIFY_INTERACTION: `${API_BASE_URL}/forum/verify-interaction`,
  TOPIC_AI_KIT: (id) => `${API_BASE_URL}/forum/${id}/ai-kit`,
};

export const SHOP_API = {
  CREATE_ORDER: `${API_BASE_URL}/shop/orders`,
  GET_ORDER: (id) => `${API_BASE_URL}/shop/orders/${id}`,
  LIST_ORDERS: `${API_BASE_URL}/shop/orders`
};

export const CHALLENGE_API = {
  CREATE: `${API_BASE_URL}/challenge`,
  MY: `${API_BASE_URL}/challenge/my`,
  DETAIL: (id) => `${API_BASE_URL}/challenge/${id}`,
  CHECKIN: (id) => `${API_BASE_URL}/challenge/${id}/checkin`
};
