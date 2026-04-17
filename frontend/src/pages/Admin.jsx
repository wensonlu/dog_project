import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';

const REJECT_REASON_TEMPLATES = [
    '居住条件暂不匹配',
    '养宠经验还需要补充',
    '联系方式暂时无法核验',
    '当前申请资料不完整'
];

const Admin = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [rejectTarget, setRejectTarget] = useState(null);
    const [selectedRejectReason, setSelectedRejectReason] = useState(REJECT_REASON_TEMPLATES[0]);
    const [customRejectReason, setCustomRejectReason] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/applications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setApplications(data);
        } catch (error) {
            console.error('获取申请列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId, userId, dogName) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, dogName })
            });

            if (response.ok) {
                alert('审核通过！已向用户发送通知');
                fetchApplications();
            }
        } catch (error) {
            console.error('审核失败:', error);
            alert('审核失败，请重试');
        }
    };

    const handleReject = async (applicationId, userId, dogName, reason) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, dogName, reason })
            });

            if (response.ok) {
                alert('已拒绝申请并通知用户');
                setRejectTarget(null);
                setCustomRejectReason('');
                setSelectedRejectReason(REJECT_REASON_TEMPLATES[0]);
                fetchApplications();
            }
        } catch (error) {
            console.error('拒绝失败:', error);
            alert('操作失败，请重试');
        }
    };

    const openRejectModal = (application) => {
        setRejectTarget(application);
        setSelectedRejectReason(REJECT_REASON_TEMPLATES[0]);
        setCustomRejectReason('');
    };

    const submitRejectDecision = () => {
        if (!rejectTarget) return;

        const reason = customRejectReason.trim() || selectedRejectReason;
        handleReject(rejectTarget.id, rejectTarget.user_id, rejectTarget.dog_name, reason);
    };

    const filteredApplications = applications.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        };
        const labels = {
            pending: '待审核',
            approved: '已通过',
            rejected: '已拒绝'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-[430px] h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="relative mx-auto max-w-[430px] min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background-light dark:bg-background-dark border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-[#1b120e] dark:text-white">领养管理系统</h1>
                    <div className="size-10"></div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto">
                    {[
                        { key: 'all', label: '全部' },
                        { key: 'pending', label: '待审核' },
                        { key: 'approved', label: '已通过' },
                        { key: 'rejected', label: '已拒绝' }
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                                filter === key
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            <div className="p-4 space-y-4">
                {filteredApplications.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">inbox</span>
                        <p className="text-zinc-500">暂无申请记录</p>
                    </div>
                ) : (
                    filteredApplications.map((app) => (
                        <div
                            key={app.id}
                            className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-md"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-[#1b120e] dark:text-white">
                                        {app.full_name}
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        申请领养：<span className="font-semibold text-primary">{app.dog_name}</span>
                                    </p>
                                </div>
                                {getStatusBadge(app.status)}
                            </div>

                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <span className="material-symbols-outlined text-[18px]">phone</span>
                                    <span>{app.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                                    <span>{app.address}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <span className="material-symbols-outlined text-[18px]">home</span>
                                    <span>{app.housing_type} · {app.has_pets ? '有其他宠物' : '无其他宠物'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                                    <span>{new Date(app.created_at).toLocaleString('zh-CN')}</span>
                                </div>
                            </div>

                            {app.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openRejectModal(app)}
                                        className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                    >
                                        拒绝
                                    </button>
                                    <button
                                        onClick={() => handleApprove(app.id, app.user_id, app.dog_name)}
                                        className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold transition-colors hover:bg-primary/90"
                                    >
                                        通过审核
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {rejectTarget && (
                <div className="fixed inset-0 z-40 flex items-end bg-black/40 px-4 pb-4 pt-12">
                    <div className="w-full rounded-[28px] bg-white p-5 shadow-2xl dark:bg-zinc-900">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">选择拒绝原因模板</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    给 {rejectTarget.full_name} 的反馈会随通知一起发送
                                </p>
                            </div>
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {REJECT_REASON_TEMPLATES.map((template) => (
                                <button
                                    key={template}
                                    type="button"
                                    onClick={() => setSelectedRejectReason(template)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                                        selectedRejectReason === template
                                            ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
                                            : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                                    }`}
                                >
                                    {template}
                                </button>
                            ))}
                        </div>

                        <label className="mt-4 block">
                            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">补充说明</span>
                            <textarea
                                value={customRejectReason}
                                onChange={(event) => setCustomRejectReason(event.target.value)}
                                rows="3"
                                placeholder="可补充具体建议，留空则直接发送模板"
                                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            />
                        </label>

                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setRejectTarget(null)}
                                className="flex-1 rounded-2xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={submitRejectDecision}
                                className="flex-1 rounded-2xl bg-rose-500 py-3 text-sm font-semibold text-white"
                            >
                                确认拒绝
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
