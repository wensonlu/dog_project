const H5_DEBUG_BUFFER_KEY = 'h5_debug_buffer_v1';
const H5_DEBUG_ENABLED_KEY = 'h5_debug_enabled_v1';
const H5_DEBUG_MAX = 300;

let initialized = false;
let originalFetch = null;
let originalXhrOpen = null;
let originalXhrSend = null;
let originalConsole = {};

function readBuffer() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(H5_DEBUG_BUFFER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuffer(list) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(H5_DEBUG_BUFFER_KEY, JSON.stringify(list.slice(-H5_DEBUG_MAX)));
    window.dispatchEvent(new CustomEvent('h5-debug-log-change'));
  } catch {
    // ignore write errors
  }
}

function pushLog(level, source, payload) {
  const next = readBuffer();
  next.push({
    ts: new Date().toISOString(),
    level,
    source,
    payload,
  });
  writeBuffer(next);
}

function safeStringify(value) {
  try {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function patchConsole() {
  if (typeof window === 'undefined') return;
  const levels = ['log', 'info', 'warn', 'error'];
  levels.forEach((level) => {
    originalConsole[level] = window.console[level].bind(window.console);
    window.console[level] = (...args) => {
      pushLog(level, 'console', args.map((item) => safeStringify(item)).join(' '));
      originalConsole[level](...args);
    };
  });
}

function patchFetch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const started = Date.now();
    const [url, options] = args;
    const method = options?.method || url?.method || 'GET';
    const requestUrl = url?.url || url;
    try {
      const response = await originalFetch(...args);
      pushLog('info', 'fetch', {
        method,
        url: String(requestUrl),
        status: response.status,
        durationMs: Date.now() - started,
      });
      return response;
    } catch (err) {
      pushLog('error', 'fetch', {
        method,
        url: String(requestUrl),
        durationMs: Date.now() - started,
        error: err?.message || 'fetch failed',
      });
      throw err;
    }
  };
}

function patchXhr() {
  if (typeof window === 'undefined' || typeof window.XMLHttpRequest === 'undefined') return;
  originalXhrOpen = window.XMLHttpRequest.prototype.open;
  originalXhrSend = window.XMLHttpRequest.prototype.send;

  window.XMLHttpRequest.prototype.open = function openPatched(method, url, ...rest) {
    this.__debugMethod = method;
    this.__debugUrl = url;
    this.__debugStart = Date.now();
    return originalXhrOpen.call(this, method, url, ...rest);
  };

  window.XMLHttpRequest.prototype.send = function sendPatched(body) {
    const onDone = () => {
      pushLog('info', 'xhr', {
        method: this.__debugMethod || 'GET',
        url: String(this.__debugUrl || ''),
        status: this.status,
        durationMs: Date.now() - (this.__debugStart || Date.now()),
      });
    };

    this.addEventListener('load', onDone, { once: true });
    this.addEventListener('error', () => {
      pushLog('error', 'xhr', {
        method: this.__debugMethod || 'GET',
        url: String(this.__debugUrl || ''),
        durationMs: Date.now() - (this.__debugStart || Date.now()),
        error: 'xhr error',
      });
    }, { once: true });

    return originalXhrSend.call(this, body);
  };
}

export function initH5DebugCapture() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  patchConsole();
  patchFetch();
  patchXhr();
  pushLog('info', 'system', 'H5 debug capture initialized');
}

export function getH5DebugEnabled() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(H5_DEBUG_ENABLED_KEY) === '1';
}

export function setH5DebugEnabled(enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(H5_DEBUG_ENABLED_KEY, enabled ? '1' : '0');
}

export function getH5DebugLogs() {
  return readBuffer();
}

export function clearH5DebugLogs() {
  writeBuffer([]);
}

export async function ensureVConsoleLoaded() {
  if (typeof window === 'undefined') return false;
  if (window.VConsole) return true;
  const existing = document.querySelector('script[data-vconsole-loader="1"]');
  if (existing) return false;

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/vconsole@3.15.1/dist/vconsole.min.js';
    script.async = true;
    script.dataset.vconsoleLoader = '1';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return Boolean(window.VConsole);
}

export function enableVConsole() {
  if (typeof window === 'undefined' || !window.VConsole) return false;
  if (window.__h5VConsole) {
    window.__h5VConsole.show();
    return true;
  }
  window.__h5VConsole = new window.VConsole();
  return true;
}

export function disableVConsole() {
  if (typeof window === 'undefined') return;
  if (window.__h5VConsole?.destroy) {
    window.__h5VConsole.destroy();
  }
  window.__h5VConsole = null;
}

export function exportH5DebugLogs() {
  if (typeof window === 'undefined') return;
  const logs = readBuffer();
  const content = JSON.stringify({ exportedAt: new Date().toISOString(), logs }, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `h5-debug-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
