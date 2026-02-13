# 智能推荐功能设计方案

**创建日期**: 2026-02-13
**状态**: 已确认,待实施

## 1. 系统概述

### 功能定位
在筛选页面嵌入智能推荐逻辑,通过5个生活方式问题收集用户偏好,使用规则匹配+特征打分算法计算匹配度,在页面顶部展示Top 3-5推荐宠物。

### 技术架构

**三层结构:**
1. **前端层 (React组件)**
   - `RecommendationQuestionnaire.jsx`: 5题问卷组件,支持展开/收起
   - `RecommendedDogsSection.jsx`: 推荐区块,展示Top 3-5结果
   - `DogsPage.jsx`: 现有筛选页面,集成上述组件

2. **后端层 (Node.js/Express)**
   - `POST /api/recommendations/calculate`: 接收问卷答案,返回推荐宠物列表
   - 复用现有`dogs`表查询,无需新建数据库表
   - 使用Supabase query builder构建动态查询

3. **匹配算法 (服务层)**
   - `backend/services/recommendationService.js`: 核心匹配逻辑
   - 两阶段计算: 硬性条件过滤 → traits特征打分排序
   - 返回结构: `{ dogId, matchScore, matchReasons: [] }`

### 数据流
```
用户填写问卷 → 前端发送答案 → 后端查询dogs表 →
算法计算匹配度 → 返回排序结果 → 前端渲染推荐区块
```

### 存储策略
- 问卷答案存储在前端localStorage(首次填写后记住90天)
- 不创建新表,所有匹配基于现有dogs表字段
- 后期可扩展: 创建`user_preferences`表持久化偏好

---

## 2. 问卷设计

### 5个问题的具体设计

```javascript
const QUESTIONNAIRE = [
  {
    id: 'living_space',
    question: '您的居住环境是?',
    options: [
      { value: 'apartment_small', label: '小户型公寓(<60㎡)', size: 'small' },
      { value: 'apartment_medium', label: '中户型公寓(60-120㎡)', size: 'medium' },
      { value: 'house', label: '独栋房屋/别墅', size: 'large' }
    ]
  },
  {
    id: 'companion_time',
    question: '每天能陪伴宠物多久?',
    options: [
      { value: 'less_2h', label: '少于2小时(上班族)', traits: ['独立'] },
      { value: '2_5h', label: '2-5小时', traits: ['温顺','友好'] },
      { value: 'more_5h', label: '5小时以上', traits: ['活泼','粘人'] }
    ]
  },
  {
    id: 'family_members',
    question: '家中是否有小孩或老人?',
    options: [
      { value: 'yes_kids', label: '有小孩', traits: ['友好','温顺','耐心'] },
      { value: 'yes_elderly', label: '有老人', traits: ['温顺','安静'] },
      { value: 'no', label: '都没有', traits: [] }
    ]
  },
  {
    id: 'activity_level',
    question: '您希望宠物的活跃程度?',
    options: [
      { value: 'calm', label: '安静型(不爱运动)', traits: ['安静','温顺'] },
      { value: 'moderate', label: '适中型', traits: ['友好'] },
      { value: 'active', label: '活泼型(需要大量运动)', traits: ['活泼','好动'] }
    ]
  },
  {
    id: 'grooming_tolerance',
    question: '能否接受需要频繁打理的长毛宠物?',
    options: [
      { value: 'yes', label: '可以(愿意定期美容)', coatType: ['long'] },
      { value: 'no', label: '不太方便(倾向短毛)', coatType: ['short'] }
    ]
  }
];
```

### localStorage存储格式
```javascript
{
  "pet_recommendation_preferences": {
    "living_space": "apartment_medium",
    "companion_time": "2_5h",
    "family_members": "yes_kids",
    "activity_level": "moderate",
    "grooming_tolerance": "no",
    "timestamp": 1707823200000,  // 90天过期
    "version": "1.0"
  }
}
```

---

## 3. 匹配算法

### 两阶段算法流程

#### 阶段1: 硬性条件过滤
根据用户答案先过滤出符合基本条件的宠物:

```javascript
function applyHardFilters(preferences) {
  let query = supabase.from('dogs').select('*').eq('status', 'available');

  // 根据居住空间过滤体型
  const sizeMap = {
    'apartment_small': ['小型'],
    'apartment_medium': ['小型', '中型'],
    'house': ['小型', '中型', '大型']
  };
  const allowedSizes = sizeMap[preferences.living_space];
  query = query.in('size', allowedSizes);

  // 根据美容意愿过滤毛发类型
  if (preferences.grooming_tolerance === 'no') {
    query = query.eq('coat_type', 'short');
  }

  return query;
}
```

#### 阶段2: 特征匹配打分
对通过硬性过滤的宠物计算匹配分数:

```javascript
function calculateMatchScore(dog, preferences) {
  let score = 0;
  const matchReasons = [];

  // 从问卷答案提取期望traits
  const desiredTraits = [
    ...getTraitsFromAnswer(preferences.companion_time),
    ...getTraitsFromAnswer(preferences.family_members),
    ...getTraitsFromAnswer(preferences.activity_level)
  ];

  // 计算traits匹配度(每匹配1个+20分)
  const dogTraits = dog.traits || [];
  desiredTraits.forEach(trait => {
    if (dogTraits.includes(trait)) {
      score += 20;
      matchReasons.push(`性格匹配: ${trait}`);
    }
  });

  // 年龄加分(幼年+10分,成年+5分)
  if (dog.age < 2) {
    score += 10;
    matchReasons.push('年轻易适应');
  } else if (dog.age < 6) {
    score += 5;
  }

  // 健康状态加分(已疫苗+5分,已绝育+5分)
  if (dog.is_vaccinated) score += 5;
  if (dog.is_sterilized) score += 5;

  return { score, matchReasons };
}
```

### 返回结果格式
```javascript
{
  "recommendations": [
    {
      "id": 123,
      "name": "小黄",
      "breed": "金毛",
      "matchScore": 65,
      "matchReasons": ["性格匹配: 友好", "性格匹配: 温顺", "年轻易适应"],
      ...dogDetails
    }
  ]
}
```

---

## 4. 前端UI设计

### 页面布局结构

```
DogsPage.jsx (筛选页面)
├── RecommendationQuestionnaire (顶部问卷组件)
│   ├── 默认折叠,显示"获取智能推荐"按钮
│   ├── 展开后显示5个问题(单选)
│   └── 提交后保存到localStorage
│
├── RecommendedDogsSection (推荐区块 - 条件显示)
│   ├── 仅在用户完成问卷后显示
│   ├── 卡片式布局,横向滚动
│   ├── 每个卡片显示:
│   │   - 宠物照片
│   │   - 名字/品种/年龄
│   │   - 匹配度(百分比 + 进度条)
│   │   - 匹配原因标签(最多3个)
│   └── 点击卡片跳转详情页
│
└── DogsList (现有的筛选结果列表)
    └── 保持原有功能不变
```

### 推荐区块视觉设计
- **背景色**: 浅蓝色渐变(#F0F8FF → #E6F3FF)
- **标题**: "为您推荐" + 刷新按钮(重新填写问卷)
- **匹配度显示**: 绿色圆形进度条 + 百分比数字
- **匹配原因**: 小型徽章(如"性格友好" "易适应")

### 交互流程
1. 用户首次访问 → 显示"获取智能推荐"按钮
2. 点击展开问卷 → 填写5个问题
3. 提交 → 调用API → 显示推荐区块
4. 90天内再访问 → 自动加载上次偏好,直接显示推荐

---

## 5. API设计与错误处理

### 后端API端点

**POST /api/recommendations/calculate**

请求体:
```javascript
{
  "preferences": {
    "living_space": "apartment_medium",
    "companion_time": "2_5h",
    "family_members": "yes_kids",
    "activity_level": "moderate",
    "grooming_tolerance": "no"
  }
}
```

响应(成功):
```javascript
{
  "success": true,
  "recommendations": [
    { id, name, breed, matchScore, matchReasons, ...dogDetails }
  ],
  "totalMatches": 15
}
```

响应(无匹配):
```javascript
{
  "success": true,
  "recommendations": [],
  "message": "暂无符合条件的宠物,请调整筛选条件"
}
```

### 错误处理策略

1. **前端降级**: localStorage读取失败 → 提示重新填写问卷
2. **后端降级**: 推荐API失败 → 返回最新发布的5只宠物(兜底方案)
3. **空结果处理**: 硬性过滤后无结果 → 放宽条件(如允许中型犬用户看到小型犬)
4. **性能优化**: 匹配计算超过500ms → 返回前10个结果,避免超时

### 测试计划
- **单元测试**: 匹配算法打分逻辑
- **集成测试**: API端到端调用
- **边界测试**: 0个匹配/100+个匹配

---

## 6. 实施计划

### 开发顺序
1. 后端服务层: recommendationService.js (匹配算法)
2. 后端路由: POST /api/recommendations/calculate
3. 前端问卷组件: RecommendationQuestionnaire.jsx
4. 前端推荐区块: RecommendedDogsSection.jsx
5. 集成到DogsPage.jsx
6. 测试与优化

### 预估工作量
- 后端开发: 4-6小时
- 前端开发: 6-8小时
- 测试与调优: 2-3小时
- **总计**: 2-3个工作日

---

## 7. 后期优化方向

1. **数据持久化**: 创建user_preferences表,为登录用户保存偏好
2. **协同过滤**: 基于"相似用户"的领养记录推荐
3. **A/B测试**: 测试不同打分权重对转化率的影响
4. **机器学习**: 使用历史数据训练推荐模型
