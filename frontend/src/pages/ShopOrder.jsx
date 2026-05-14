import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getShopProductById } from '../data/shopProducts';

const ADDRESS_STORAGE_KEY = 'shop_checkout_address_v1';

function ShopOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') || '';
  const quantityParam = Number.parseInt(searchParams.get('quantity') || '1', 10);
  const quantity = Number.isNaN(quantityParam) || quantityParam < 1 ? 1 : quantityParam;

  const product = useMemo(() => getShopProductById(productId), [productId]);

  const [address, setAddress] = useState(() => {
    const initial = {
      receiver: '',
      phone: '',
      provinceCity: '',
      detail: ''
    };
    try {
      const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...initial, ...parsed };
      }
      return initial;
    } catch (error) {
      console.warn('Parse checkout address failed:', error);
      return initial;
    }
  });
  const [savedHint, setSavedHint] = useState('');

  const totalPrice = (product?.price || 0) * quantity;

  const onAddressChange = (key, value) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  const saveAddress = () => {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
    setSavedHint('地址已保存');
    setTimeout(() => setSavedHint(''), 1200);
  };

  if (!product) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] p-6">
        <p className="text-gray-600">商品信息无效，请返回商城重新选择。</p>
        <button onClick={() => navigate('/shop')} className="mt-3 px-4 py-2 bg-rose-500 text-white rounded-lg">返回商城</button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#F5F5F0] pb-28">
      <header className="sticky top-0 ios-safe-top z-30 bg-[#F5F5F0]/92 backdrop-blur-xl px-4 pt-6 pb-4 border-b border-[#e7ddd0]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="size-10 rounded-xl bg-white border border-[#e7ddd0] shadow-sm flex items-center justify-center text-gray-700"
            aria-label="返回商品"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <p className="text-[11px] tracking-wide text-rose-500 font-semibold">CHECKOUT</p>
            <h1 className="text-lg font-black text-gray-900 leading-tight">确认订单</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-bold text-gray-900 mb-3">收货地址</h2>
          <div className="space-y-2">
            <input
              value={address.receiver}
              onChange={(e) => onAddressChange('receiver', e.target.value)}
              placeholder="收货人"
              className="w-full h-11 px-3 rounded-xl border border-gray-200"
            />
            <input
              value={address.phone}
              onChange={(e) => onAddressChange('phone', e.target.value)}
              placeholder="手机号"
              className="w-full h-11 px-3 rounded-xl border border-gray-200"
            />
            <input
              value={address.provinceCity}
              onChange={(e) => onAddressChange('provinceCity', e.target.value)}
              placeholder="省市区"
              className="w-full h-11 px-3 rounded-xl border border-gray-200"
            />
            <textarea
              value={address.detail}
              onChange={(e) => onAddressChange('detail', e.target.value)}
              placeholder="详细地址（街道/门牌号）"
              className="w-full min-h-20 p-3 rounded-xl border border-gray-200 resize-none"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <button onClick={saveAddress} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">保存地址</button>
            {savedHint && <span className="text-sm text-emerald-600">{savedHint}</span>}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-bold text-gray-900 mb-3">商品信息</h2>
          <div className="flex gap-3">
            <img src={product.image} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-bold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-500 mt-1">数量 x {quantity}</p>
              <p className="text-red-500 font-extrabold mt-2">¥{product.price}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-600">合计</span>
            <span className="text-xl font-black text-red-500">¥{totalPrice}</span>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 p-4">
        <button
          type="button"
          className="w-full py-3 rounded-xl bg-rose-300 text-white font-bold cursor-not-allowed"
          title="支付功能暂未开放"
        >
          支付（暂未开放）
        </button>
      </div>
    </div>
  );
}

export default ShopOrder;
