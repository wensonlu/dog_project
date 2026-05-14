import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { SHOP_PRODUCTS } from '../data/shopProducts';

const CATEGORIES = ['全部', '主粮', '零食', '清洁', '出行', '健康'];

function Shop() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredProducts = useMemo(() => {
    if (activeCategory === '全部') return SHOP_PRODUCTS;
    return SHOP_PRODUCTS.filter((item) => item.category === activeCategory);
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
