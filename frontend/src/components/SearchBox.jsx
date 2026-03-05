import React, { useState, useEffect } from 'react';

const SearchBox = ({ onSearch, value }) => {
  const [localValue, setLocalValue] = useState(value);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onSearch]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-400">
        search
      </span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="搜索宠物名称、品种..."
        className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/50 transition-all"
      />
      {localValue && (
        <button
          onClick={() => setLocalValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <span className="material-symbols-outlined text-zinc-400 text-sm">close</span>
        </button>
      )}
    </div>
  );
};

export default SearchBox;
