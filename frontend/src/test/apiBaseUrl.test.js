import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from '../config/apiBaseUrl';

describe('resolveApiBaseUrl', () => {
  it('uses the stable backend URL inside a native Capacitor app', () => {
    expect(resolveApiBaseUrl({
      isNative: true,
      isDev: false,
      hostname: 'localhost',
    })).toBe('https://dog-project-6aoq.vercel.app/api');
  });

  it('keeps custom-domain H5 requests same-origin', () => {
    expect(resolveApiBaseUrl({
      isNative: false,
      isDev: false,
      hostname: 'dog.example.com',
    })).toBe('/api');
  });
});
