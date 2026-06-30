export function extractDogProjectWebPath(url) {
  if (!url) return null;

  try {
    const parsed = new URL(String(url));
    if (parsed.protocol !== 'dogproject:' || parsed.hostname !== 'web') {
      return null;
    }

    const path = parsed.searchParams.get('path');
    if (!path || !path.startsWith('/')) {
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

export function handleDogProjectWebNavigationUrl(url, navigate) {
  const path = extractDogProjectWebPath(url);
  if (!path) return false;

  navigate(path);
  return true;
}
