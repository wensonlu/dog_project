const REJECT_REASON_LABELS = {
    profile_incomplete: '资料不完整',
    housing_not_suitable: '居住条件暂不匹配',
    contact_unreachable: '暂时无法联系到您',
    experience_mismatch: '养宠经验暂不匹配',
    adoption_mismatch: '当前匹配度不足',
    duplicate_application: '存在重复申请',
    other: '其他原因'
};

function normalizeRejectReasonCodes(reasonCodes) {
    if (!Array.isArray(reasonCodes)) {
        return [];
    }

    return [...new Set(
        reasonCodes
            .filter(code => typeof code === 'string')
            .map(code => code.trim())
            .filter(Boolean)
    )];
}

function toTimelineEvent({ type, title, description, occurredAt, meta = {} }) {
    return {
        type,
        title,
        description,
        occurredAt,
        meta,
    };
}

function buildApplicationTimeline(application) {
    const events = [];

    if (application?.created_at) {
        events.push(toTimelineEvent({
            type: 'submitted',
            title: '申请已提交',
            description: '我们已收到您的领养申请，正在等待审核。',
            occurredAt: application.created_at,
            meta: {
                status: application.status || 'pending',
            },
        }));
    }

    if (application?.reviewed_at && application?.status === 'approved') {
        events.push(toTimelineEvent({
            type: 'approved',
            title: '申请已通过',
            description: '申请已通过审核，请留意后续联系安排。',
            occurredAt: application.reviewed_at,
            meta: {
                status: application.status,
            },
        }));
    }

    if (application?.reviewed_at && application?.status === 'rejected') {
        const rejectReasonCodes = normalizeRejectReasonCodes(application.reject_reason_codes);
        events.push(toTimelineEvent({
            type: 'rejected',
            title: '申请未通过',
            description: '本次申请未通过审核，可根据反馈完善后再次申请。',
            occurredAt: application.reviewed_at,
            meta: {
                status: application.status,
                rejectReasonCodes,
                rejectReasonLabels: rejectReasonCodes.map(code => REJECT_REASON_LABELS[code] || code),
                rejectNote: application.reject_note || null,
            },
        }));
    }

    return events.sort((left, right) => new Date(left.occurredAt) - new Date(right.occurredAt));
}

function calculateProfileCompletion(profile = {}) {
    const trackedFields = ['full_name', 'avatar_url', 'bio', 'phone'];
    const missingFields = trackedFields.filter(field => {
        const value = profile[field];
        return value === null || value === undefined || String(value).trim() === '';
    });

    const completedFields = trackedFields.length - missingFields.length;
    const percentage = Math.round((completedFields / trackedFields.length) * 100);

    return {
        totalFields: trackedFields.length,
        completedFields,
        percentage,
        isComplete: missingFields.length === 0,
        missingFields,
    };
}

function buildRejectionMessage(dogName, rejectReasonCodes, rejectNote) {
    const normalizedCodes = normalizeRejectReasonCodes(rejectReasonCodes);
    const reasonLabels = normalizedCodes.map(code => REJECT_REASON_LABELS[code] || code);
    const reasonsText = reasonLabels.length > 0 ? `原因：${reasonLabels.join('、')}。` : '';
    const noteText = rejectNote && String(rejectNote).trim() ? `补充说明：${String(rejectNote).trim()}` : '';

    return `很抱歉，您申请领养 ${dogName} 的申请未通过审核。${reasonsText}${noteText}`.trim();
}

module.exports = {
    REJECT_REASON_LABELS,
    normalizeRejectReasonCodes,
    buildApplicationTimeline,
    calculateProfileCompletion,
    buildRejectionMessage,
};
