import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CHALLENGE_API } from '../config/api';
import { useAuth } from '../context/AuthContext';

function ChallengeCheckin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const progress = useMemo(() => {
    if (!task) return 0;
    return Math.min(100, Math.round(((task.progressDays || 0) / (task.durationDays || 7)) * 100));
  }, [task]);

  const loadTask = useCallback(async () => {
    if (!id || !user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`${CHALLENGE_API.DETAIL(id)}?userId=${encodeURIComponent(user.id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '加载任务失败');
      setTask(data.task || null);
    } catch (error) {
      console.error('load task failed:', error);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleCheckin = async () => {
    if (!id || !user?.id) return;
    setSubmitting(true);
    try {
      const response = await fetch(CHALLENGE_API.CHECKIN(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, note: '今日已按计划使用用品' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '打卡失败');
      setTask(data.task || task);
    } catch (error) {
      console.error('checkin failed:', error);
      window.alert(error.message || '打卡失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] p-6 text-gray-600">加载打卡任务中...</div>;
  }

  if (!task) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] p-6">
        <p className="text-gray-700">任务不存在或无权限查看。</p>
        <button onClick={() => navigate('/shop')} className="mt-3 px-4 py-2 rounded-lg bg-gray-900 text-white">返回商城</button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-10">
      <header className="sticky top-0 ios-safe-top z-30 bg-[#F5F5F0]/92 backdrop-blur-xl px-4 pt-6 pb-4 border-b border-[#e7ddd0]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shop')}
            className="size-10 rounded-xl bg-white border border-[#e7ddd0] shadow-sm flex items-center justify-center text-gray-700"
            aria-label="返回商城"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <p className="text-[11px] tracking-wide text-emerald-600 font-semibold">CHALLENGE</p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">7天用品打卡</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        <section className="bg-white rounded-2xl p-4">
          <p className="text-sm text-gray-600">任务状态：{task.status === 'completed' ? '已完成' : '进行中'}</p>
          <div className="mt-3 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">已打卡 {task.progressDays}/{task.durationDays} 天</p>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-bold text-gray-900 mb-2">最近打卡</h2>
          {(task.checkins || []).length === 0 ? (
            <p className="text-sm text-gray-500">还没有打卡记录，今天开始第一天吧。</p>
          ) : (
            <div className="space-y-2">
              {task.checkins.slice().reverse().map((item) => (
                <div key={item.id} className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                  <p className="text-sm font-semibold text-gray-800">Day {item.dayIndex}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={handleCheckin}
          disabled={submitting || task.status === 'completed'}
          className="w-full h-11 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60"
        >
          {task.status === 'completed' ? '任务已完成' : submitting ? '打卡中...' : '今日打卡'}
        </button>
      </main>
    </div>
  );
}

export default ChallengeCheckin;
