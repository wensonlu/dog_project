import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAuthenticatedRnDeepLink } from '../utils/rnDeepLink';

describe('buildAuthenticatedRnDeepLink', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('uses a one-time mobile ticket for logged-in RN preview links', async () => {
    window.localStorage.setItem('pawmate_session', JSON.stringify({ access_token: 'token-123' }));
    window.localStorage.setItem('pawmate_user', JSON.stringify({ id: 'user-7' }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ticket: 'ticket-abc' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(buildAuthenticatedRnDeepLink('dogproject://forum/16')).resolves.toBe('dogproject://forum/16?ticket=ticket-abc');

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/mobile-ticket'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer token-123' }),
    }));
  });

  it('falls back to wrapped session params when ticket creation fails', async () => {
    window.localStorage.setItem('pawmate_session', JSON.stringify({ access_token: 'token-123' }));
    window.localStorage.setItem('pawmate_user', JSON.stringify({ id: 'user-7' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const url = await buildAuthenticatedRnDeepLink('dogproject://forum');

    expect(url).toBe('dogproject://forum?params=token%3Dtoken-123%26userId%3Duser-7');
  });

  it('keeps RN links unchanged when no H5 session exists', async () => {
    await expect(buildAuthenticatedRnDeepLink('dogproject://content')).resolves.toBe('dogproject://content');
  });
});
