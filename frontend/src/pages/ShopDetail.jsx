import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PRODUCTS = [
  { id: 'food-001', name: '幼犬低敏主粮 2kg', price: 129, intro: '低敏配方，适合肠胃敏感犬只', image: 'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=900' },
  { id: 'food-002', name: '成犬全价鸡肉粮 5kg', price: 219, intro: '均衡营养配方，满足成犬日常所需', image: 'https://images.unsplash.com/photo-1601758177266-bc599de87707?w=900' },
  { id: 'food-003', name: '无谷鸭肉配方主粮 2kg', price: 169, intro: '无谷轻负担，适合肠胃敏感宠物', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900' },
  { id: 'snack-001', name: '冻干鸡胸肉零食', price: 49, intro: '高蛋白轻负担，训练互动更高效', image: 'https://images.unsplash.com/photo-1601758124096-6f37c22f4b54?w=900' },
  { id: 'snack-002', name: '牛肉磨牙棒 20支', price: 39, intro: '帮助清洁牙齿，满足咀嚼需求', image: 'https://images.unsplash.com/photo-1601758064136-6d0b3fe16f11?w=900' },
  { id: 'snack-003', name: '三文鱼营养布丁杯', price: 29, intro: '湿粮口感，适合挑食和补水场景', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=900' },
  { id: 'clean-001', name: '温和抑菌洗护泡沫', price: 59, intro: '日常清洁不刺激，适合敏感肌', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900' },
  { id: 'clean-002', name: '宠物除味抑菌喷雾', price: 45, intro: '快速分解异味，保持环境清新', image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=900' },
  { id: 'clean-003', name: '可降解拾便袋 8卷', price: 22, intro: '韧性防漏，遛宠清洁更省心', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900' },
  { id: 'travel-001', name: '防爆冲胸背牵引套', price: 89, intro: '人体工学受力分散，遛宠更轻松', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900' },
  { id: 'travel-002', name: '透气折叠宠物背包', price: 159, intro: '短途外出轻便收纳，透气不闷热', image: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=900' },
  { id: 'travel-003', name: '车载安全固定带', price: 36, intro: '限制位移，减少行车途中风险', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900' },
  { id: 'health-001', name: '宠物关节营养软糖', price: 139, intro: '补充关节营养，支持日常活力', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900' }
  ,
  { id: 'health-002', name: '益生菌肠胃调理粉', price: 79, intro: '平衡肠道菌群，缓解软便困扰', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900' },
  { id: 'health-003', name: '鱼油亮毛滴剂', price: 68, intro: '补充Omega脂肪酸，支持皮毛状态', image: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=900' }
];

function ShopDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const product = useMemo(() => PRODUCTS.find((item) => item.id === id), [id]);

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
      <header className="sticky top-0 ios-safe-top bg-[#F5F5F0]/95 backdrop-blur-sm px-4 pt-6 pb-3 z-20">
        <button onClick={() => navigate('/shop')} className="text-sm text-gray-600">← 返回商城</button>
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
        <button className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold">去下单</button>
      </div>
    </div>
  );
}

export default ShopDetail;
