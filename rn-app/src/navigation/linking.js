import * as Linking from 'expo-linking';

export const appScheme = 'dogproject';

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function parseLaunchPayload(url) {
  if (!url) return {};
  try {
    const parsed = Linking.parse(url);
    const rawPath = String(parsed.path || '').replace(/^\/+/, '');
    const petFromPath = rawPath.match(/^pet\/(\d+)$/)?.[1] || null;

    return {
      petId: normalizeString(petFromPath || parsed.queryParams?.petId),
      token: normalizeString(parsed.queryParams?.token),
      userId: normalizeString(parsed.queryParams?.userId),
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
