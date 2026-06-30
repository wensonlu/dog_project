import { describe, expect, it, vi } from 'vitest';
import { extractDogProjectWebPath, handleDogProjectWebNavigationUrl } from '../utils/appUrlNavigation';

describe('appUrlNavigation', () => {
  it('extracts the H5 route from dogproject web deep links', () => {
    expect(extractDogProjectWebPath('dogproject://web?path=%2Fforum')).toBe('/forum');
    expect(extractDogProjectWebPath('dogproject://web?path=/profile')).toBe('/profile');
  });

  it('ignores unsupported app URLs', () => {
    expect(extractDogProjectWebPath('dogproject://content')).toBe(null);
    expect(extractDogProjectWebPath('https://example.com')).toBe(null);
    expect(extractDogProjectWebPath('')).toBe(null);
  });

  it('navigates only when a dogproject web path is present', () => {
    const navigate = vi.fn();

    expect(handleDogProjectWebNavigationUrl('dogproject://web?path=%2Fshop', navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/shop');

    expect(handleDogProjectWebNavigationUrl('dogproject://rn-demo', navigate)).toBe(false);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
