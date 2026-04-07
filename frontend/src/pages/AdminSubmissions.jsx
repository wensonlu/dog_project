import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { supabase } from '../config/supabase';

const AdminSubmissions = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [expandedId, setExpandedId] = useState(null); // 展开的卡片 ID
    const [agentData, setAgentData] = useState({}); // 存储 Agent 数据

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/dog-submissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setSubmissions(data);
        } catch (error) {
            console.error('获取发布申请列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 切换卡片展开状态
    const toggleExpand = async (submissionId, dogId) => {
        if (expandedId === submissionId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(submissionId);

        // 如果已经获取过Agent数据，不重复获取
        if (agentData[submissionId]) return;

        // 获取Agent数据（如果有）
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/agent/${dogId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setAgentData(prev => ({
                        ...prev,
                        [submissionId]: data.data
                    }));
                }
            }
        } catch (error) {
            console.error('获取Agent数据失败:', error);
        }
    };

    const handleApprove = async (submissionId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/dog-submissions/${submissionId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert('审核通过！小狗已发布到平台');
                fetchSubmissions();
            } else {
                alert(data.error || '审核失败，请重试');
            }
        } catch (error) {
            console.error('审核失败:', error);
            alert('审核失败，请重试');
        }
    };

    const handleReject = async (submissionId) => {
        const reason = prompt('请输入拒绝原因（可选）：');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const token = session.access_token;
            const response = await fetch(`${API_BASE_URL}/dog-submissions/${submissionId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: reason || null })
            });

            const data = await response.json();

            if (response.ok) {
                alert('已拒绝发布申请并通知用户');
                fetchSubmissions();
            } else {
                alert(data.error || '操作失败，请重试');
            }
        } catch (error) {
            console.error('拒绝失败:', error);
            alert('操作失败，请重试');
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'all') return true;
        return sub.status === filter;
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
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
                {labels[status] || '未知'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        onClick={() => navigate('/profile')}
                        className="size-10 rounded-full bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-[#1b120e] dark:text-white">发布管理系统</h1>
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

            {/* Submissions List */}
            <div className="p-4 space-y-4 pb-24">
                {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-zinc-300 mb-4">inbox</span>
                        <p className="text-zinc-500">暂无发布申请记录</p>
                    </div>
                ) : (
                    filteredSubmissions.map((sub) => (
                        <div
                            key={sub.id}
                            className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-md cursor-pointer"
                            onClick={() => sub.dog_id && toggleExpand(sub.id, sub.dog_id)}
                        >
                            {/* Dog Image and Info */}
                            <div className="flex gap-4 mb-4">
                                <img
                                    src={sub.image}
                                    alt={sub.name}
                                    className="w-24 h-24 rounded-xl object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#1b120e] dark:text-white">
                                                {sub.name}
                                            </h3>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {sub.breed} · {sub.age} · {sub.gender}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(sub.status)}
                                            {sub.dog_id && (
                                                <span className="material-symbols-outlined text-zinc-400">
                                                    {expandedId === sub.id ? 'expand_less' : 'expand_more'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {sub.location}
                                    </p>
                                </div>
                            </div>

                            {/* 展开的简历内容 */}
                            {expandedId === sub.id && agentData[sub.id] && (
                                <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        AI 生成的领养简历
                                    </h4>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">
                                        {agentData[sub.id].generatedBio}
                                    </p>
                                    {agentData[sub.id].personalityTraits && (
                                        <div className="flex flex-wrap gap-2">
                                            {agentData[sub.id].personalityTraits.map((trait, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-primary text-white text-xs rounded-full font-medium"
                                                >
                                                    {trait}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            {sub.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                                    {sub.description}
                                </p>
                            )}

                            {/* Submission Info */}
                            <div className="space-y-2 mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                    <span>提交人：{sub.profiles?.email || sub.profiles?.full_name || '未知'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                                    <span>提交时间：{formatDate(sub.created_at)}</span>
                                </div>
                                {sub.reviewed_at && (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        <span>审核时间：{formatDate(sub.reviewed_at)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {sub.status === 'pending' && (
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleReject(sub.id)}
                                        className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                    >
                                        拒绝
                                    </button>
                                    <button
                                        onClick={() => handleApprove(sub.id)}
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
        </div>
    );
};

export default AdminSubmissions;
