import * as Linking from 'expo-linking';

export const appScheme = 'dogproject';

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function parseWrappedParams(raw) {
  const text = normalizeString(raw);
  if (!text) return null;

  try {
    return new URLSearchParams(decodeURIComponent(text));
  } catch (_err) {
    try {
      return new URLSearchParams(text);
    } catch (_err2) {
      return null;
    }
  }
}

function parseJsonBundle(raw) {
  const text = normalizeString(raw);
  if (!text) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(text));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_err) {
    return null;
  }
}

export function parseLaunchPayload(url) {
  if (!url) return {};
  try {
    const parsed = Linking.parse(url);
    const rawPath = String(parsed.path || '').replace(/^\/+/, '');
    const petFromPath = rawPath.match(/^pet\/(\d+)$/)?.[1] || null;
    const forumFromPath = rawPath.match(/^forum\/(\d+)$/)?.[1] || null;
    const wrappedParams = parseWrappedParams(parsed.queryParams?.params);
    const jsonBundle = parseJsonBundle(parsed.queryParams?.bundle);

    return {
      petId: normalizeString(
        petFromPath || parsed.queryParams?.petId || wrappedParams?.get('petId') || jsonBundle?.petId
      ),
      topicId: normalizeString(
        forumFromPath ||
          parsed.queryParams?.topicId ||
          wrappedParams?.get('topicId') ||
          jsonBundle?.topicId
      ),
      token: normalizeString(
        parsed.queryParams?.token || wrappedParams?.get('token') || jsonBundle?.token
      ),
      userId: normalizeString(
        parsed.queryParams?.userId || wrappedParams?.get('userId') || jsonBundle?.userId
      ),
    };
  } catch (_err) {
    return {};
  }
}

export function extractPetIdFromUrl(url) {
  return parseLaunchPayload(url)?.petId || null;
}

export function buildPetUrl(petId) {
  return Linking.createURL(`pet/${petId}`);
}

export function buildForumUrl(topicId) {
  return Linking.createURL(`forum/${topicId}`);
}
