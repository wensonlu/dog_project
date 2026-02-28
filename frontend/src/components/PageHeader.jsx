import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * 公共页面 Header 组件
 * @param {string} icon - Material Symbols 图标名称
 * @param {string} title - 主标题
 * @param {string} subtitle - 副标题（可选）
 * @param {string} gradient - 渐变色类名（可选）
 * @param {boolean} showBack - 是否显示返回按钮
 * @param {React.ReactNode} rightAction - 右侧操作按钮（可选）
 */
const PageHeader = ({
  icon = 'pets',
  title,
  subtitle,
  gradient = 'from-rose-400 to-pink-500',
  showBack = false,
  rightAction
}) => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-5 pt-6 pb-4 border-b border-[#e7d7d0]/50 dark:border-zinc-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="size-11 rounded-2xl bg-white dark:bg-zinc-800 border border-[#e7d7d0] dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="material-symbols-outlined text-xl text-[#1b120e] dark:text-[#fcf9f8]">arrow_back</span>
            </motion.button>
          ) : (
            <div className={`size-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-${gradient.split(' ')[1].replace('to-', '')}/50`}>
              <span className="material-symbols-outlined text-2xl text-white">{icon}</span>
            </div>
          )}

          <div>
            {subtitle && (
              <p className="text-xs text-primary font-medium">{subtitle}</p>
            )}
            <h1 className="text-lg font-bold text-[#1b120e] dark:text-[#fcf9f8]">{title}</h1>
          </div>
        </div>

        {rightAction && (
          <div className="flex items-center gap-2">
            {rightAction}
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default PageHeader;
