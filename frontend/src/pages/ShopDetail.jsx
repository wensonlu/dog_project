import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getShopProductById } from '../data/shopProducts';

function ShopDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const product = useMemo(() => getShopProductById(id), [id]);

  if (!product) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] p-6">
        <p className="text-gray-600">商品不存在或已下架</p>
        <button onClick={() => navigate('/shop')} className="mt-3 px-4 py-2 bg-rose-500 text-white rounded-lg">返回商城</button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-24">
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
            <p className="text-[11px] tracking-wide text-rose-500 font-semibold">SHOP</p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">商品详情</h1>
          </div>
        </div>
      </header>

      <main className="px-4">
        <img src={product.image} alt={product.name} className="w-full h-72 object-cover rounded-2xl" />
        <section className="bg-white rounded-2xl p-4 mt-4">
          <h1 className="text-xl font-black text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-2">{product.intro}</p>
          <p className="text-2xl font-extrabold text-red-500 mt-3">¥{product.price}</p>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 p-4 flex gap-3">
        <button className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold">加入购物清单</button>
        <button
          onClick={() => navigate(`/shop/order?productId=${encodeURIComponent(product.id)}&quantity=1`)}
          className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold"
        >
          去下单
        </button>
      </div>
    </div>
  );
}

export default ShopDetail;
