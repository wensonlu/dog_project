import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserver,
});

// Mock scrollTo
window.scrollTo = vi.fn();

if (!window.localStorage) {
  const store = new Map();
  const storage = {
    getItem: vi.fn((key) => (store.has(String(key)) ? store.get(String(key)) : null)),
    setItem: vi.fn((key, value) => {
      store.set(String(key), String(value));
    }),
    removeItem: vi.fn((key) => {
      store.delete(String(key));
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index) => Array.from(store.keys())[index] || null),
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
}
