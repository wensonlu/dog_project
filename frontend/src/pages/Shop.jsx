import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const CATEGORIES = ['全部', '主粮', '零食', '清洁', '出行', '健康'];

const PRODUCTS = [
  { id: 'food-001', name: '幼犬低敏主粮 2kg', price: 129, rating: 4.8, category: '主粮', tag: '高蛋白', image: 'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=600' },
  { id: 'food-002', name: '成犬全价鸡肉粮 5kg', price: 219, rating: 4.7, category: '主粮', tag: '日常喂养', image: 'https://images.unsplash.com/photo-1601758177266-bc599de87707?w=600' },
  { id: 'food-003', name: '无谷鸭肉配方主粮 2kg', price: 169, rating: 4.8, category: '主粮', tag: '肠胃友好', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600' },
  { id: 'snack-001', name: '冻干鸡胸肉零食', price: 49, rating: 4.7, category: '零食', tag: '训练奖励', image: 'https://images.unsplash.com/photo-1601758124096-6f37c22f4b54?w=600' },
  { id: 'snack-002', name: '牛肉磨牙棒 20支', price: 39, rating: 4.6, category: '零食', tag: '洁齿', image: 'https://images.unsplash.com/photo-1601758064136-6d0b3fe16f11?w=600' },
  { id: 'snack-003', name: '三文鱼营养布丁杯', price: 29, rating: 4.7, category: '零食', tag: '适口性高', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600' },
  { id: 'clean-001', name: '温和抑菌洗护泡沫', price: 59, rating: 4.6, category: '清洁', tag: '免冲洗', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600' },
  { id: 'clean-002', name: '宠物除味抑菌喷雾', price: 45, rating: 4.6, category: '清洁', tag: '环境除味', image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600' },
  { id: 'clean-003', name: '可降解拾便袋 8卷', price: 22, rating: 4.7, category: '清洁', tag: '出门必备', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600' },
  { id: 'travel-001', name: '防爆冲胸背牵引套', price: 89, rating: 4.9, category: '出行', tag: '热卖', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600' },
  { id: 'travel-002', name: '透气折叠宠物背包', price: 159, rating: 4.7, category: '出行', tag: '短途通勤', image: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600' },
  { id: 'travel-003', name: '车载安全固定带', price: 36, rating: 4.6, category: '出行', tag: '安全出行', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600' },
  { id: 'health-001', name: '宠物关节营养软糖', price: 139, rating: 4.8, category: '健康', tag: '兽医推荐', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600' }
  ,
  { id: 'health-002', name: '益生菌肠胃调理粉', price: 79, rating: 4.7, category: '健康', tag: '调理肠道', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600' },
  { id: 'health-003', name: '鱼油亮毛滴剂', price: 68, rating: 4.8, category: '健康', tag: '毛发护理', image: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=600' }
];

function Shop() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredProducts = useMemo(() => {
    if (activeCategory === '全部') return PRODUCTS;
    return PRODUCTS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

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
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
          {filteredProducts.length === 0 ? (
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
