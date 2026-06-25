import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getShopProductById } from '../data/shopProducts';
import { CHALLENGE_API, SHOP_API } from '../config/api';
import { useAuth } from '../context/AuthContext';

const ADDRESS_STORAGE_KEY = 'shop_checkout_address_v1';

function ShopOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') || '';
  const topicId = searchParams.get('topicId') || '';
  const sourceParam = searchParams.get('source') || '';
  const agentAuthorizationId = searchParams.get('agentAuthorizationId') || '';
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
  const [checkoutMode, setCheckoutMode] = useState(topicId ? 'challenge' : 'direct');
  const [submitting, setSubmitting] = useState(false);
  const [actionHint, setActionHint] = useState('');
  const [directOrderConfirmOpen, setDirectOrderConfirmOpen] = useState(false);
  const [challengeConfirmOpen, setChallengeConfirmOpen] = useState(false);

  const totalPrice = (product?.price || 0) * quantity;
  const isAiAssistedOrder = sourceParam === 'ai-assistant' || Boolean(agentAuthorizationId);

  const onAddressChange = (key, value) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  const saveAddress = () => {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));
    setSavedHint('地址已保存');
    setTimeout(() => setSavedHint(''), 1200);
  };

  const handleGoChallenge = () => {
    if (!user?.id || !topicId) return;
    setChallengeConfirmOpen(true);
  };

  const confirmGoChallenge = async () => {
    if (!user?.id || !topicId || !product) return;
    setChallengeConfirmOpen(false);
    setSubmitting(true);
    try {
      const orderRef = `ord_${Date.now()}`;
      const response = await fetch(CHALLENGE_API.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topicId,
          orderRef,
          productId: product.id,
          durationDays: 7
        })
      });
      const data = await response.json();
      if (!response.ok || !data?.task?.id) {
        throw new Error(data?.error || '创建打卡任务失败');
      }
      navigate(`/challenge/${data.task.id}`);
    } catch (error) {
      console.error('create challenge failed:', error);
      window.alert(error.message || '创建打卡任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const validateAddress = () => {
    if (!address.receiver || !address.phone || !address.provinceCity || !address.detail) {
      window.alert('请先完善收货地址');
      return false;
    }
    return true;
  };

  const handleDirectOrder = () => {
    if (!user?.id) {
      window.alert('请先登录');
      return;
    }
    if (!validateAddress()) return;
    setDirectOrderConfirmOpen(true);
  };

  const confirmDirectOrder = async () => {
    if (!user?.id || !product) return;
    setDirectOrderConfirmOpen(false);
    setSubmitting(true);
    setActionHint('');
    try {
      const requestPrefix = isAiAssistedOrder ? 'ai' : 'direct';
      const requestMarker = agentAuthorizationId || Date.now();
      const clientRequestId = `${requestPrefix}_${requestMarker}_${product.id}`;
      const response = await fetch(SHOP_API.CREATE_ORDER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          quantity,
          source: isAiAssistedOrder ? 'ai-assisted-checkout' : 'direct-checkout',
          clientRequestId,
          agentAuthorizationId: agentAuthorizationId || null
        })
      });
      const data = await response.json();
      if (!response.ok || !data?.order?.id) {
        throw new Error(data?.error || '创建订单失败');
      }
      setActionHint(`订单已创建：${data.order.id}，支付能力即将开放`);
    } catch (error) {
      console.error('create direct order failed:', error);
      window.alert(error.message || '创建订单失败');
    } finally {
      setSubmitting(false);
    }
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

        <section className="bg-white rounded-2xl p-4">
          <h2 className="font-bold text-gray-900 mb-3">购买方式</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setCheckoutMode('direct')}
              className={`w-full text-left rounded-xl border p-3 transition ${checkoutMode === 'direct' ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white'}`}
            >
              <p className="text-sm font-bold text-gray-900">直接购买</p>
              <p className="text-xs text-gray-500 mt-1">立即创建订单，后续支持在线支付</p>
            </button>
            <button
              type="button"
              onClick={() => setCheckoutMode('challenge')}
              disabled={!topicId}
              className={`w-full text-left rounded-xl border p-3 transition disabled:opacity-50 ${checkoutMode === 'challenge' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'}`}
            >
              <p className="text-sm font-bold text-gray-900">7天打卡领取</p>
              <p className="text-xs text-gray-500 mt-1">完成7天用品打卡后领取，适合内容推荐场景</p>
            </button>
          </div>
          {!topicId && <p className="text-xs text-amber-600 mt-2">当前不是帖子推荐入口，暂不可使用打卡领取</p>}
          {actionHint && <p className="text-xs text-emerald-600 mt-2">{actionHint}</p>}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-gray-100 p-4">
        {checkoutMode === 'challenge' ? (
          <button
            type="button"
            onClick={handleGoChallenge}
            disabled={submitting || !user?.id || !topicId}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold disabled:opacity-60"
          >
            {submitting ? '创建任务中...' : '去打卡任务页'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDirectOrder}
            disabled={submitting || !user?.id}
            className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold disabled:opacity-60"
          >
            {submitting ? '创建订单中...' : '直接购买'}
          </button>
        )}
      </div>

      {challengeConfirmOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:items-center sm:pb-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-confirm-title"
        >
          <div className="w-full max-w-[390px] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <p className="text-[11px] font-bold tracking-wide text-emerald-600">CHALLENGE CONFIRM</p>
              <h2 id="challenge-confirm-title" className="mt-1 text-xl font-black text-gray-900">
                确认创建打卡任务
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                任务会关联当前帖子和商品，创建后可在打卡页继续完成。
              </p>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-extrabold text-gray-900">{product.name}</p>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="font-bold text-gray-700">7天用品打卡</span>
                  <span className="text-gray-500">帖子 {topicId}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={() => setChallengeConfirmOpen(false)}
                className="h-12 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700"
              >
                先不创建
              </button>
              <button
                type="button"
                onClick={confirmGoChallenge}
                disabled={submitting}
                className="h-12 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {directOrderConfirmOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:items-center sm:pb-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="direct-order-confirm-title"
        >
          <div className="w-full max-w-[390px] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <p className="text-[11px] font-bold tracking-wide text-amber-600">
                {isAiAssistedOrder ? 'AI ASSISTED ORDER' : 'ORDER CONFIRM'}
              </p>
              <h2 id="direct-order-confirm-title" className="mt-1 text-xl font-black text-gray-900">
                确认创建订单
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                请确认商品、数量和金额。点击确认后才会创建订单记录，当前不会自动支付。
              </p>

              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex gap-3">
                  <img src={product.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-gray-900">{product.name}</p>
                    <p className="mt-1 text-sm text-gray-500">数量 x {quantity}</p>
                    <p className="mt-2 text-base font-black text-red-500">合计 ¥{totalPrice}</p>
                  </div>
                </div>
              </div>

              {isAiAssistedOrder && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  这是 AI 助手带来的购买方案。你正在确认最终下单决策，授权编号：
                  <span className="font-bold">{agentAuthorizationId || '未提供'}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={() => setDirectOrderConfirmOpen(false)}
                className="h-12 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700"
              >
                再检查一下
              </button>
              <button
                type="button"
                onClick={confirmDirectOrder}
                disabled={submitting}
                className="h-12 rounded-xl bg-gray-900 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? '创建中...' : '确认创建订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopOrder;
