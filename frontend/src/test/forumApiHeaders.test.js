import { describe, expect, it } from 'vitest';
import { buildForumJsonHeaders } from '../utils/forumApiHeaders';

describe('buildForumJsonHeaders', () => {
  it('includes the saved Supabase access token for forum write requests', () => {
    const headers = buildForumJsonHeaders({
      session: {
        access_token: 'token-123',
      },
    });

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-123',
    });
  });

  it('omits authorization when no token is available', () => {
    expect(buildForumJsonHeaders({ session: null })).toEqual({
      'Content-Type': 'application/json',
    });
  });
});
