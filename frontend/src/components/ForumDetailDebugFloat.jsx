import React, { useMemo, useState } from 'react';
import { getForumDetailMode, setForumDetailMode } from '../utils/forumDetailDebug';

const ForumDetailDebugFloat = () => {
  const isCapacitorRuntime = typeof window !== 'undefined' && !!window.Capacitor;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(getForumDetailMode());

  const modeLabel = useMemo(() => (mode === 'rn' ? 'RN' : 'H5'), [mode]);

  if (!isCapacitorRuntime) return null;

  const switchMode = (nextMode) => {
    setForumDetailMode(nextMode);
    setMode(nextMode);
  };

  return (
    <div className="fixed right-3 bottom-24 z-[120]">
      {open && (
        <div className="mb-2 w-56 rounded-xl border border-[#f6d7ac] bg-[#fff7ed] p-3 shadow-lg dark:border-[#5b3a1e] dark:bg-[#2b1c11]">
          <p className="text-xs font-bold text-[#9a3412] dark:text-[#fdba74] mb-2">论坛详情打开方式</p>
          <div className="flex items-center gap-2">
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
          <p className="mt-2 text-[11px] text-[#7c2d12] dark:text-[#fdba74]/90">当前: {modeLabel}</p>
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
