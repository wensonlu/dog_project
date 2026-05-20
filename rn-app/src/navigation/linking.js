import * as Linking from 'expo-linking';

export const appScheme = 'dogproject';

export function extractPetIdFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const rawPath = String(parsed.path || '').replace(/^\/+/, '');
    const petFromPath = rawPath.match(/^pet\/(\d+)$/)?.[1];
    if (petFromPath) return petFromPath;

    const petFromQuery = parsed.queryParams?.petId;
    if (petFromQuery) return String(petFromQuery);
  } catch (_err) {
    return null;
  }
  return null;
}

export function buildPetUrl(petId) {
  return Linking.createURL(`pet/${petId}`);
}
