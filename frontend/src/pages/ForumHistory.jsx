import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getForumBrowseHistory, clearForumBrowseHistory } from '../utils/forumHistory';

function formatViewedAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return '刚刚';
  if (diffM < 60) return `${diffM} 分钟前`;
  if (diffH < 24) return `${diffH} 小时前`;
  if (diffD < 7) return `${diffD} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

const ForumHistory = () => {
  const navigate = useNavigate();
  const [list, setList] = React.useState(getForumBrowseHistory());

  const handleClear = () => {
    if (!window.confirm('确定清空全部浏览记录吗？')) return;
    clearForumBrowseHistory();
    setList([]);
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col bg-background-light dark:bg-background-dark pb-24">
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 pt-12 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/forum')}
            className="size-9 rounded-full bg-white/80 dark:bg-zinc-800/80 flex items-center justify-center text-[#1b120e] dark:text-white"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-[#1b120e] dark:text-white">浏览记录</h1>
          {list.length > 0 ? (
            <button
              onClick={handleClear}
              className="text-sm text-warm-beige font-medium"
            >
              清空
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-warm-beige">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-40">history</span>
            <p className="text-base font-medium">暂无浏览记录</p>
            <p className="text-sm mt-1 opacity-80">在发现页点击话题后会出现在这里</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {list.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/forum/${item.id}`)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-colors"
                >
                  <p className="text-sm font-medium text-[#1b120e] dark:text-white line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-warm-beige mt-1">{formatViewedAt(item.viewedAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ForumHistory;
