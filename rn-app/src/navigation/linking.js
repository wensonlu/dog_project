export const appScheme = 'dogproject';

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function decodeQueryComponent(value) {
  try {
    return decodeURIComponent(String(value || '').replace(/\+/g, ' '));
  } catch (_err) {
    return String(value || '');
  }
}

function parseQueryParams(raw) {
  const params = {};
  const text = normalizeString(raw);
  if (!text) return params;

  text.split('&').forEach((part) => {
    if (!part) return;
    const separator = part.indexOf('=');
    const rawKey = separator >= 0 ? part.slice(0, separator) : part;
    const rawValue = separator >= 0 ? part.slice(separator + 1) : '';
    params[decodeQueryComponent(rawKey)] = decodeQueryComponent(rawValue);
  });

  return params;
}

function parseWrappedParams(raw) {
  const text = normalizeString(raw);
  if (!text) return null;
  return parseQueryParams(text);
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
  const raw = String(url).trim();
  const noScheme = raw.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
  const [pathPart, queryPart = ''] = noScheme.split('?');
  const path = String(pathPart || '').replace(/^\/+/, '');
  const pathSegments = path.split('/').filter(Boolean);
  const host = normalizeString(pathSegments[0]);
  const firstPathId = normalizeString(pathSegments[1]);

  const queryParams = parseQueryParams(queryPart);

  const wrappedParams = parseWrappedParams(queryParams?.params);
  const jsonBundle = parseJsonBundle(queryParams?.bundle);
  const idFromQuery = normalizeString(
    queryParams?.id || wrappedParams?.id || jsonBundle?.id
  );
  const routeFromHost = ['content', 'stories', 'story', 'forum', 'pet', 'web'].includes(host)
    ? host
    : null;
  const entityIdFromHost = normalizeString(firstPathId || idFromQuery);

  return {
    routeType: routeFromHost,
    petId: normalizeString(
      queryParams?.petId ||
        wrappedParams?.petId ||
        jsonBundle?.petId ||
        (routeFromHost === 'pet' ? entityIdFromHost : null)
    ),
    topicId: normalizeString(
      queryParams?.topicId ||
        wrappedParams?.topicId ||
        jsonBundle?.topicId ||
        (routeFromHost === 'forum' ? entityIdFromHost : null)
    ),
    storyId: normalizeString(
      queryParams?.storyId ||
        wrappedParams?.storyId ||
        jsonBundle?.storyId ||
        (routeFromHost === 'story' ? entityIdFromHost : null)
    ),
    webPath: normalizeString(
      queryParams?.path || wrappedParams?.path || jsonBundle?.path
    ),
    token: normalizeString(
      queryParams?.token || wrappedParams?.token || jsonBundle?.token
    ),
    userId: normalizeString(
      queryParams?.userId || wrappedParams?.userId || jsonBundle?.userId
    ),
    ticket: normalizeString(
      queryParams?.ticket || wrappedParams?.ticket || jsonBundle?.ticket
    ),
  };
}

export function extractPetIdFromUrl(url) {
  return parseLaunchPayload(url)?.petId || null;
}

export function buildPetUrl(petId) {
  return `${appScheme}://pet/${petId}`;
}

export function buildForumUrl(topicId) {
  return `${appScheme}://forum/${topicId}`;
}

export function buildContentUrl() {
  return `${appScheme}://content`;
}

export function buildStoryUrl(storyId) {
  return `${appScheme}://story/${storyId}`;
}

export function buildWebUrl(path) {
  return `${appScheme}://web?path=${encodeURIComponent(path)}`;
}
