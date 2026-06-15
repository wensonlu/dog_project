import { describe, expect, it } from 'vitest';
import { getWebOAuthRedirectUrl } from '../utils/oauthRedirect';

describe('getWebOAuthRedirectUrl', () => {
    it('redirects production OAuth callbacks to the login route', () => {
        expect(getWebOAuthRedirectUrl('https://dog-project-lyart.vercel.app')).toBe(
            'https://dog-project-lyart.vercel.app/login'
        );
    });

    it('normalizes an origin with a trailing slash', () => {
        expect(getWebOAuthRedirectUrl('http://localhost:5173/')).toBe(
            'http://localhost:5173/login'
        );
    });
});
