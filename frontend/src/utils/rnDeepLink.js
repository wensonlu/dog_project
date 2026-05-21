import { API_BASE_URL } from '../config/api';

function safeJsonParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getSessionFromLocalStorage() {
  if (typeof window === 'undefined') {
    return { token: '', userId: '' };
  }

  const session = safeJsonParse(window.localStorage.getItem('pawmate_session'));
  const user = safeJsonParse(window.localStorage.getItem('pawmate_user'));

  return {
    token: session?.access_token || '',
    userId: user?.id ? String(user.id) : '',
  };
}

export function buildRnPilotDeepLink(routeType, entityId, { wrapParams = true } = {}) {
  const normalizedRoute = routeType === 'forum' ? 'forum' : 'pet';
  const id = String(entityId || '').trim();
  const { token, userId } = getSessionFromLocalStorage();

  const sessionQuery = new URLSearchParams();
  if (token) sessionQuery.set('token', token);
  if (userId) sessionQuery.set('userId', userId);

  const finalQuery = new URLSearchParams();
  if (sessionQuery.toString()) {
    if (wrapParams) {
      finalQuery.set('params', sessionQuery.toString());
    } else {
      finalQuery.set('token', token);
      finalQuery.set('userId', userId);
    }
  }

  const suffix = finalQuery.toString() ? `?${finalQuery.toString()}` : '';
  return `dogproject://${normalizedRoute}/${id}${suffix}`;
}

export function buildRnPilotPlainDeepLink(routeType, entityId) {
  const normalizedRoute = routeType === 'forum' ? 'forum' : 'pet';
  const id = String(entityId || '').trim();
  return `dogproject://${normalizedRoute}/${id}`;
}

async function createMobileTicket(token) {
  const response = await fetch(`${API_BASE_URL}/auth/mobile-ticket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return payload?.ticket || null;
}

export async function buildRnPilotDeepLinkWithTicket(routeType, entityId) {
  const { token } = getSessionFromLocalStorage();
  if (!token) {
    return buildRnPilotDeepLink(routeType, entityId, { wrapParams: true });
  }

  const ticket = await createMobileTicket(token).catch(() => null);
  if (!ticket) {
    return buildRnPilotDeepLink(routeType, entityId, { wrapParams: true });
  }

  const normalizedRoute = routeType === 'forum' ? 'forum' : 'pet';
  const id = String(entityId || '').trim();
  const query = new URLSearchParams();
  query.set('ticket', ticket);
  return `dogproject://${normalizedRoute}/${id}?${query.toString()}`;
}
