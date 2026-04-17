import React from 'react';

const TIMELINE_STEPS = [
    { key: 'submitted', title: '已提交申请', hint: '表单已送达，系统已记录您的申请' },
    { key: 'reviewing', title: '资料审核中', hint: '工作人员正在核对居住条件与养宠准备' },
    { key: 'signing', title: '等待签约', hint: '审核通过后会进入沟通与签约阶段' },
    { key: 'completed', title: '完成领养', hint: '签约完成后即可接狗回家' }
];

const getCurrentStepIndex = (status) => {
    switch (status) {
        case 'completed':
            return 3;
        case 'approved':
            return 2;
        case 'rejected':
            return 1;
        case 'pending':
        default:
            return 1;
    }
};

const getCurrentStageLabel = (status) => {
    switch (status) {
        case 'completed':
            return '完成领养';
        case 'approved':
            return '等待签约';
        case 'rejected':
            return '资料审核未通过';
        case 'pending':
        default:
            return '资料审核中';
    }
};

const ApplicationTimeline = ({ status = 'pending', className = '' }) => {
    const currentStepIndex = getCurrentStepIndex(status);
    const currentStageLabel = getCurrentStageLabel(status);

    return (
        <section className={`rounded-2xl border border-rose-100/70 bg-white/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/90 ${className}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">申请进度</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">当前阶段</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                    {currentStageLabel}
                </span>
            </div>

            <div className="space-y-4">
                {TIMELINE_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={step.key} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold ${
                                        isCompleted
                                            ? 'border-rose-400 bg-rose-500 text-white'
                                            : 'border-rose-100 bg-rose-50 text-rose-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500'
                                    }`}
                                >
                                    {index + 1}
                                </div>
                                {index < TIMELINE_STEPS.length - 1 && (
                                    <div
                                        className={`mt-1 h-10 w-0.5 ${
                                            index < currentStepIndex ? 'bg-rose-400' : 'bg-rose-100 dark:bg-zinc-700'
                                        }`}
                                    />
                                )}
                            </div>
                            <div className="pt-0.5">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
                                    {isCurrent && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                            当前阶段
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{step.hint}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ApplicationTimeline;
