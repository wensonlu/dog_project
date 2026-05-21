const MAX_LOGS = 300;
const listeners = new Set();

const state = {
  consoleLogs: [],
  networkLogs: [],
};

function notify() {
  listeners.forEach((listener) => listener({ ...state }));
}

function push(listKey, entry) {
  state[listKey] = [...state[listKey], entry].slice(-MAX_LOGS);
  notify();
}

export function addConsoleLog(level, message) {
  push('consoleLogs', {
    ts: new Date().toISOString(),
    level,
    message,
  });
}

export function addNetworkLog(item) {
  push('networkLogs', {
    ts: new Date().toISOString(),
    ...item,
  });
}

export function clearLogs() {
  state.consoleLogs = [];
  state.networkLogs = [];
  notify();
}

export function subscribeDebugStore(listener) {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}

export function exportLogsText() {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      consoleLogs: state.consoleLogs,
      networkLogs: state.networkLogs,
    },
    null,
    2
  );
}
