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
  const raw = String(url).trim();
  const noScheme = raw.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
  const [pathPart, queryPart = ''] = noScheme.split('?');
  const path = String(pathPart || '').replace(/^\/+/, '');
  const pathSegments = path.split('/').filter(Boolean);
  const host = normalizeString(pathSegments[0]);
  const firstPathId = normalizeString(pathSegments[1]);

  const queryParams = {};
  const queryString = normalizeString(queryPart);
  if (queryString) {
    const parsedQuery = new URLSearchParams(queryString);
    parsedQuery.forEach((value, key) => {
      queryParams[key] = value;
    });
  }

  const wrappedParams = parseWrappedParams(queryParams?.params);
  const jsonBundle = parseJsonBundle(queryParams?.bundle);
  const idFromQuery = normalizeString(
    queryParams?.id || wrappedParams?.get('id') || jsonBundle?.id
  );
  const routeFromHost = host === 'forum' ? 'forum' : host === 'pet' ? 'pet' : null;
  const entityIdFromHost = normalizeString(firstPathId || idFromQuery);

  return {
    petId: normalizeString(
      queryParams?.petId ||
        wrappedParams?.get('petId') ||
        jsonBundle?.petId ||
        (routeFromHost === 'pet' ? entityIdFromHost : null)
    ),
    topicId: normalizeString(
      queryParams?.topicId ||
        wrappedParams?.get('topicId') ||
        jsonBundle?.topicId ||
        (routeFromHost === 'forum' ? entityIdFromHost : null)
    ),
    token: normalizeString(
      queryParams?.token || wrappedParams?.get('token') || jsonBundle?.token
    ),
    userId: normalizeString(
      queryParams?.userId || wrappedParams?.get('userId') || jsonBundle?.userId
    ),
    ticket: normalizeString(
      queryParams?.ticket || wrappedParams?.get('ticket') || jsonBundle?.ticket
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
