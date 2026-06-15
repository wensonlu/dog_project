export const STABLE_API_BASE_URL = 'https://dog-project-6aoq.vercel.app/api';

export function resolveApiBaseUrl({
  envApiUrl,
  isDev,
  isNative,
  hostname,
}) {
  if (envApiUrl) {
    return envApiUrl.replace(/\/+$/, '');
  }

  if (isDev) {
    return 'http://localhost:5001/api';
  }

  if (isNative || hostname.endsWith('.vercel.app')) {
    return STABLE_API_BASE_URL;
  }

  return '/api';
}
