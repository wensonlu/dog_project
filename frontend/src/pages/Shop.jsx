import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const CATEGORIES = ['全部', '主粮', '零食', '清洁', '出行', '健康'];

const PRODUCTS = [
  { id: 'food-001', name: '幼犬低敏主粮 2kg', price: 129, rating: 4.8, category: '主粮', tag: '高蛋白', image: 'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=600' },
  { id: 'snack-001', name: '冻干鸡胸肉零食', price: 49, rating: 4.7, category: '零食', tag: '训练奖励', image: 'https://images.unsplash.com/photo-1601758124096-6f37c22f4b54?w=600' },
  { id: 'clean-001', name: '温和抑菌洗护泡沫', price: 59, rating: 4.6, category: '清洁', tag: '免冲洗', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600' },
  { id: 'travel-001', name: '防爆冲胸背牵引套', price: 89, rating: 4.9, category: '出行', tag: '热卖', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600' },
  { id: 'health-001', name: '宠物关节营养软糖', price: 139, rating: 4.8, category: '健康', tag: '兽医推荐', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600' }
];

function Shop() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredProducts = useMemo(() => {
    if (activeCategory === '全部') return PRODUCTS;
    return PRODUCTS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const retryLoad = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const injectFailure = () => {
    setError('网络开小差了，点击重试继续逛');
    setLoading(false);
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-20">
      <header className="sticky top-0 ios-safe-top z-30 bg-[#F5F5F0]/95 backdrop-blur-sm px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">宠物用品商城</h1>
            <p className="text-sm text-gray-500 mt-1">领养后养护好物，一站购齐</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">
        <section className="bg-white rounded-2xl p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  activeCategory === category ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-3">
          <div className="flex gap-2 mb-3">
            <button data-ui="btn-start" onClick={retryLoad} className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 text-xs font-bold">开始执行</button>
            <button data-ui="btn-fail" onClick={injectFailure} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">失败注入</button>
            <button data-ui="btn-retry" onClick={retryLoad} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">重试</button>
            <button data-ui="btn-cancel" onClick={() => navigate('/')} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">取消</button>
          </div>

          <div data-ui="event-log" className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs mb-3">
            {loading ? 'shop.fetch.running' : error ? 'shop.fetch.failed' : 'shop.fetch.success'}
          </div>

          {loading ? (
            <div className="text-sm text-gray-500 py-6 text-center">加载中...</div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button onClick={retryLoad} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm">重试</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">暂无商品，稍后再来看看</div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/shop/${product.id}`)}
                  className="w-full text-left bg-[#FAFAF7] rounded-xl p-3"
                >
                  <div className="flex gap-3">
                    <img src={product.image} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{product.category} · {product.rating} 分</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-red-500 font-extrabold">¥{product.price}</span>
                        <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">{product.tag}</span>
                      </div>
                    </div>
                  </div>
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

export default Shop;
