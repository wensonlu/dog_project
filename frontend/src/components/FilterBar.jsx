import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterBar = ({ filters, onFilterChange, breeds }) => {
  const ageOptions = [
    { value: '', label: '全部年龄' },
    { value: 'puppy', label: '幼犬 (0-1岁)' },
    { value: 'adult', label: '成犬 (1-7岁)' },
    { value: 'senior', label: '老年犬 (7岁+)' },
  ];

  const genderOptions = [
    { value: '', label: '全部性别' },
    { value: '公', label: '公' },
    { value: '母', label: '母' },
  ];

  const hasActiveFilters = filters.breed || filters.age || filters.gender;

  return (
    <div className="space-y-2">
      {/* 筛选条件 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* 品种筛选 */}
        <select
          value={filters.breed || ''}
          onChange={(e) => onFilterChange({ ...filters, breed: e.target.value })}
          className="px-3 py-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400/50 whitespace-nowrap"
        >
          <option value="">全部品种</option>
          {breeds?.map((breed) => (
            <option key={breed} value={breed}>{breed}</option>
          ))}
        </select>

        {/* 年龄筛选 */}
        <select
          value={filters.age || ''}
          onChange={(e) => onFilterChange({ ...filters, age: e.target.value })}
          className="px-3 py-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400/50 whitespace-nowrap"
        >
          {ageOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* 性别筛选 */}
        <select
          value={filters.gender || ''}
          onChange={(e) => onFilterChange({ ...filters, gender: e.target.value })}
          className="px-3 py-1.5 bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400/50 whitespace-nowrap"
        >
          {genderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        {/* 清除筛选 */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => onFilterChange({ breed: '', age: '', gender: '' })}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-xs">refresh</span>
              清除
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FilterBar;
