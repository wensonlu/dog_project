export function getStoredForumSession(storage = window.localStorage) {
  try {
    const rawSession = storage?.getItem('pawmate_session');
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

export function buildForumJsonHeaders({ session, token } = {}) {
  const accessToken = token || session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export function buildForumUserHeaders(user, storage = window.localStorage) {
  return buildForumJsonHeaders({
    session: user?.session || getStoredForumSession(storage),
    token: user?.token,
  });
}
