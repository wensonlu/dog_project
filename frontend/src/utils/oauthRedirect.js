export const getWebOAuthRedirectUrl = (origin) =>
    `${origin.replace(/\/+$/, '')}/login`;
