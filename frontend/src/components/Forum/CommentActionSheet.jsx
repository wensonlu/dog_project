import React, { useEffect } from 'react';

/**
 * 评论/回复操作弹窗：收藏、复制、删除（仅自己的内容点击时展示）
 */
const CommentActionSheet = ({ open, onClose, onCollect, onCopy, onDelete }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleCollect = () => {
    onCollect?.();
    onClose();
  };

  const handleCopy = () => {
    onCopy?.();
    onClose();
  };

  const handleDelete = () => {
    onDelete?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-[430px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-lg pb-safe">
        <div className="p-2 space-y-1">
          <button
            type="button"
            onClick={handleCollect}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#1b120e] dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">bookmark</span>
            收藏
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#1b120e] dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">content_copy</span>
            复制
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">delete</span>
            删除
          </button>
        </div>
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-[#1b120e] dark:text-white font-medium bg-zinc-100 dark:bg-zinc-800 hover:opacity-90 transition-opacity"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentActionSheet;
