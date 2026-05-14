import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { API_BASE_URL } from '../config';

function ContentHub() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [articleRes, storyRes] = await Promise.all([
          fetch(`${API_BASE_URL}/wiki/articles?limit=4`),
          fetch(`${API_BASE_URL}/stories?page=1&limit=4`)
        ]);
        const articleData = await articleRes.json();
        const storyData = await storyRes.json();
        setArticles(articleData?.data || []);
        setStories(storyData?.data || []);
      } catch (error) {
        console.error('Load content hub failed:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-20">
      <header className="sticky top-0 ios-safe-top z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-5 pt-6 pb-4">
        <h1 className="text-2xl font-black text-gray-900">内容中心</h1>
        <p className="text-sm text-gray-500 mt-1">百科知识 + 领养故事，一站查看</p>
      </header>

      <main className="px-4 space-y-5">
        <section className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">百科精选</h2>
            <button onClick={() => navigate('/wiki')} className="text-sm text-rose-500">查看更多</button>
          </div>
          {loading ? (
            <div className="text-sm text-gray-400">加载中...</div>
          ) : articles.length === 0 ? (
            <div className="text-sm text-gray-400">暂无百科内容</div>
          ) : (
            <div className="space-y-2">
              {articles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => navigate(`/wiki/article/${article.slug}`)}
                  className="w-full text-left p-3 rounded-xl bg-rose-50/60"
                >
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{article.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">{article.summary}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">幸福故事</h2>
            <button onClick={() => navigate('/stories')} className="text-sm text-rose-500">查看更多</button>
          </div>
          {loading ? (
            <div className="text-sm text-gray-400">加载中...</div>
          ) : stories.length === 0 ? (
            <div className="text-sm text-gray-400">还没有故事，成为第一个分享者吧</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => navigate(`/stories/${story.id}`)}
                  className="text-left p-3 rounded-xl bg-amber-50"
                >
                  <p className="text-sm font-bold text-gray-900 line-clamp-2">{story.title}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1">{story.adopter?.username || '匿名用户'}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default ContentHub;
