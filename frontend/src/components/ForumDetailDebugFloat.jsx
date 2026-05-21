import React, { useEffect, useMemo, useState } from 'react';
import { getForumDetailMode, setForumDetailMode } from '../utils/forumDetailDebug';
import {
  disableVConsole,
  enableVConsole,
  ensureVConsoleLoaded,
  exportH5DebugLogs,
  clearH5DebugLogs,
  getH5DebugEnabled,
  getH5DebugLogs,
  setH5DebugEnabled,
} from '../utils/h5DebugConsole';

const ForumDetailDebugFloat = () => {
  const isCapacitorRuntime = typeof window !== 'undefined' && !!window.Capacitor;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(getForumDetailMode());
  const [avoidOverlap, setAvoidOverlap] = useState(false);
  const [h5DebugEnabled, setH5DebugState] = useState(getH5DebugEnabled());
  const [h5DebugTab, setH5DebugTab] = useState('network');
  const [h5Logs, setH5Logs] = useState(() => getH5DebugLogs());

  const modeLabel = useMemo(() => (mode === 'rn' ? 'RN' : 'H5'), [mode]);

  useEffect(() => {
    if (!isCapacitorRuntime) return undefined;

    const detectOverlap = () => {
      const debugEl = document.querySelector('[data-debug-float="forum-detail"]');
      const chatBubbleEl = document.querySelector('.chat-bubble-btn');
      if (!debugEl || !chatBubbleEl) {
        setAvoidOverlap(false);
        return;
      }

      const a = debugEl.getBoundingClientRect();
      const b = chatBubbleEl.getBoundingClientRect();
      const overlapped = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
      setAvoidOverlap(overlapped);
    };

    detectOverlap();
    window.addEventListener('resize', detectOverlap);
    window.addEventListener('scroll', detectOverlap, true);
    const timer = window.setInterval(detectOverlap, 300);
    return () => {
      window.removeEventListener('resize', detectOverlap);
      window.removeEventListener('scroll', detectOverlap, true);
      window.clearInterval(timer);
    };
  }, [isCapacitorRuntime, open]);

  useEffect(() => {
    if (!isCapacitorRuntime) return undefined;
    const syncLogs = () => setH5Logs(getH5DebugLogs());
    syncLogs();
    window.addEventListener('h5-debug-log-change', syncLogs);
    return () => window.removeEventListener('h5-debug-log-change', syncLogs);
  }, [isCapacitorRuntime]);

  if (!isCapacitorRuntime) return null;

  const switchMode = (nextMode) => {
    setForumDetailMode(nextMode);
    setMode(nextMode);
  };

  const toggleH5Debug = async () => {
    const next = !h5DebugEnabled;
    setH5DebugEnabled(next);
    setH5DebugState(next);
    if (next) {
      try {
        await ensureVConsoleLoaded();
        enableVConsole();
      } catch {
        // ignore vConsole load failures
      }
      return;
    }
    disableVConsole();
  };

  const currentH5Logs = h5Logs
    .filter((item) => (h5DebugTab === 'network' ? ['fetch', 'xhr'].includes(item.source) : item.source === 'console'))
    .slice(-8)
    .reverse();

  const networkCount = h5Logs.filter((item) => ['fetch', 'xhr'].includes(item.source)).length;

  return (
    <div
      data-debug-float="forum-detail"
      className={`fixed left-3 ${avoidOverlap ? 'bottom-40' : 'bottom-24'} z-[120] transition-all duration-200`}
    >
      {open && (
        <div className="mb-2 w-64 rounded-xl border border-[#f6d7ac] bg-[#fff7ed] p-3 shadow-lg dark:border-[#5b3a1e] dark:bg-[#2b1c11]">
          <p className="text-xs font-bold text-[#9a3412] dark:text-[#fdba74] mb-2">论坛详情打开方式</p>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => switchMode('h5')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                mode === 'h5'
                  ? 'bg-[#ea7a1b] text-white'
                  : 'bg-white text-[#9a3412] border border-[#f6d7ac] dark:bg-[#3a2718] dark:text-[#fdba74] dark:border-[#6d4a2b]'
              }`}
            >
              H5
            </button>
            <button
              type="button"
              onClick={() => switchMode('rn')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                mode === 'rn'
                  ? 'bg-[#ea7a1b] text-white'
                  : 'bg-white text-[#9a3412] border border-[#f6d7ac] dark:bg-[#3a2718] dark:text-[#fdba74] dark:border-[#6d4a2b]'
              }`}
            >
              RN
            </button>
          </div>
          <p className="mb-2 text-[11px] text-[#7c2d12] dark:text-[#fdba74]/90">当前: {modeLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleH5Debug}
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#7c2d12] text-white"
            >
              {h5DebugEnabled ? '关闭H5控制台' : '打开H5控制台'}
            </button>
            <button
              type="button"
              onClick={exportH5DebugLogs}
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white text-[#7c2d12] border border-[#f6d7ac]"
            >
              导出H5日志
            </button>
          </div>
          <div className="mt-3 rounded-lg border border-[#f6d7ac] bg-white p-2 dark:border-[#6d4a2b] dark:bg-[#3a2718]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setH5DebugTab('network')}
                  className={`rounded px-2 py-1 text-[10px] font-bold ${
                    h5DebugTab === 'network' ? 'bg-[#ea7a1b] text-white' : 'bg-[#fff7ed] text-[#7c2d12]'
                  }`}
                >
                  Network {networkCount}
                </button>
                <button
                  type="button"
                  onClick={() => setH5DebugTab('console')}
                  className={`rounded px-2 py-1 text-[10px] font-bold ${
                    h5DebugTab === 'console' ? 'bg-[#ea7a1b] text-white' : 'bg-[#fff7ed] text-[#7c2d12]'
                  }`}
                >
                  Console
                </button>
              </div>
              <button
                type="button"
                onClick={clearH5DebugLogs}
                className="text-[10px] font-bold text-[#9a3412] dark:text-[#fdba74]"
              >
                清空
              </button>
            </div>
            <div className="max-h-36 space-y-1 overflow-auto text-[10px] text-[#5c4033] dark:text-[#fed7aa]">
              {currentH5Logs.length === 0 ? (
                <p className="text-[#9ca3af]">暂无记录</p>
              ) : (
                currentH5Logs.map((item, index) => {
                  const payload = item.payload || {};
                  const label = h5DebugTab === 'network'
                    ? `${payload.method || item.source} ${payload.status || ''} ${payload.url || ''}`
                    : String(payload);
                  return (
                    <p key={`${item.ts}-${index}`} className="break-all">
                      {label}
                    </p>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-11 w-11 rounded-full bg-[#7c2d12] text-white shadow-lg flex items-center justify-center"
        title="论坛详情调试工具"
      >
        <span className="material-symbols-outlined text-[20px]">tune</span>
      </button>
    </div>
  );
};

export default ForumDetailDebugFloat;
