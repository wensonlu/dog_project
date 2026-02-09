import React, { useEffect } from 'react';

/**
 * H5 友好的确认/提示弹窗，替代 alert/confirm
 * @param {boolean} open - 是否显示
 * @param {string} title - 标题
 * @param {string} message - 正文
 * @param {string} confirmText - 主按钮文案（如「确定删除」）
 * @param {string} [cancelText] - 取消按钮文案，不传则只显示一个按钮（提示框）
 * @param {() => void} onConfirm - 点击主按钮回调
 * @param {() => void} [onCancel] - 点击取消或遮罩回调
 * @param {'primary' | 'danger'} [confirmVariant='primary'] - 主按钮样式，danger 为红色
 * @param {boolean} [confirmLoading=false] - 主按钮是否显示加载中
 */
const ConfirmModal = ({
    open,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    confirmVariant = 'primary',
    confirmLoading = false
}) => {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        window.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [open, onCancel]);

    if (!open) return null;

    const isDanger = confirmVariant === 'danger';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
        >
            {/* 遮罩：点击关闭（仅当有 cancel 时） */}
            <button
                type="button"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel ?? undefined}
                aria-label="关闭"
            />

            <div
                className="relative w-full max-w-[340px] rounded-2xl bg-card-light dark:bg-zinc-800 shadow-xl border border-[#F0E6DD] dark:border-zinc-700 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-4 text-center">
                    <h2
                        id="confirm-modal-title"
                        className="text-lg font-bold text-[#1b120e] dark:text-white"
                    >
                        {title}
                    </h2>
                    <p
                        id="confirm-modal-desc"
                        className="mt-2 text-sm text-warm-beige leading-relaxed"
                    >
                        {message}
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-2 px-4 pb-6 sm:flex-row sm:justify-end">
                    {cancelText != null && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="h-12 px-5 rounded-xl border border-zinc-200 dark:border-zinc-600 text-[#1b120e] dark:text-white font-medium text-base active:opacity-80"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirmLoading}
                        className={`h-12 px-5 rounded-xl font-medium text-base text-white min-w-[100px] active:opacity-90 disabled:opacity-60 ${
                            isDanger
                                ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                                : 'bg-primary hover:opacity-90'
                        }`}
                    >
                        {confirmLoading ? '处理中...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
