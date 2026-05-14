export const SHOP_PRODUCTS = [
  { id: 'food-001', name: '幼犬低敏主粮 2kg', price: 129, rating: 4.8, category: '主粮', tag: '高蛋白', intro: '低敏配方，适合肠胃敏感犬只', image: 'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=900' },
  { id: 'food-002', name: '成犬全价鸡肉粮 5kg', price: 219, rating: 4.7, category: '主粮', tag: '日常喂养', intro: '均衡营养配方，满足成犬日常所需', image: 'https://images.unsplash.com/photo-1601758177266-bc599de87707?w=900' },
  { id: 'food-003', name: '无谷鸭肉配方主粮 2kg', price: 169, rating: 4.8, category: '主粮', tag: '肠胃友好', intro: '无谷轻负担，适合肠胃敏感宠物', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900' },
  { id: 'snack-001', name: '冻干鸡胸肉零食', price: 49, rating: 4.7, category: '零食', tag: '训练奖励', intro: '高蛋白轻负担，训练互动更高效', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900' },
  { id: 'snack-002', name: '牛肉磨牙棒 20支', price: 39, rating: 4.6, category: '零食', tag: '洁齿', intro: '帮助清洁牙齿，满足咀嚼需求', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900' },
  { id: 'snack-003', name: '三文鱼营养布丁杯', price: 29, rating: 4.7, category: '零食', tag: '适口性高', intro: '湿粮口感，适合挑食和补水场景', image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=900' },
  { id: 'clean-001', name: '温和抑菌洗护泡沫', price: 59, rating: 4.6, category: '清洁', tag: '免冲洗', intro: '日常清洁不刺激，适合敏感肌', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900' },
  { id: 'clean-002', name: '宠物除味抑菌喷雾', price: 45, rating: 4.6, category: '清洁', tag: '环境除味', intro: '快速分解异味，保持环境清新', image: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=900' },
  { id: 'clean-003', name: '可降解拾便袋 8卷', price: 22, rating: 4.7, category: '清洁', tag: '出门必备', intro: '韧性防漏，遛宠清洁更省心', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900' },
  { id: 'travel-001', name: '防爆冲胸背牵引套', price: 89, rating: 4.9, category: '出行', tag: '热卖', intro: '人体工学受力分散，遛宠更轻松', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900' },
  { id: 'travel-002', name: '透气折叠宠物背包', price: 159, rating: 4.7, category: '出行', tag: '短途通勤', intro: '短途外出轻便收纳，透气不闷热', image: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=900' },
  { id: 'travel-003', name: '车载安全固定带', price: 36, rating: 4.6, category: '出行', tag: '安全出行', intro: '限制位移，减少行车途中风险', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900' },
  { id: 'health-001', name: '宠物关节营养软糖', price: 139, rating: 4.8, category: '健康', tag: '兽医推荐', intro: '补充关节营养，支持日常活力', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900' },
  { id: 'health-002', name: '益生菌肠胃调理粉', price: 79, rating: 4.7, category: '健康', tag: '调理肠道', intro: '平衡肠道菌群，缓解软便困扰', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=900' },
  { id: 'health-003', name: '鱼油亮毛滴剂', price: 68, rating: 4.8, category: '健康', tag: '毛发护理', intro: '补充Omega脂肪酸，支持皮毛状态', image: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=900' }
];

export function getShopProductById(id) {
  return SHOP_PRODUCTS.find((item) => item.id === id) || null;
}
