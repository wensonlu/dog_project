const { supabase } = require('../config/supabase');

/**
 * 问卷选项到数据库字段的映射配置
 */
const PREFERENCE_MAPPINGS = {
  // 居住空间 → 体型映射
  living_space: {
    'apartment_small': ['小型'],
    'apartment_medium': ['小型', '中型'],
    'house': ['小型', '中型', '大型']
  },

  // 陪伴时间 → 性格特征映射
  companion_time: {
    'less_2h': ['独立'],
    '2_5h': ['温顺', '友好'],
    'more_5h': ['活泼', '粘人']
  },

  // 家庭成员 → 性格特征映射
  family_members: {
    'yes_kids': ['友好', '温顺', '耐心'],
    'yes_elderly': ['温顺', '安静'],
    'no': []
  },

  // 活跃程度 → 性格特征映射
  activity_level: {
    'calm': ['安静', '温顺'],
    'moderate': ['友好'],
    'active': ['活泼', '好动']
  },

  // 美容意愿 → 毛发类型映射
  grooming_tolerance: {
    'yes': null,  // 接受长毛,不过滤
    'no': 'short'  // 不接受长毛,只要短毛
  }
};

/**
 * 从问卷答案中提取期望的性格特征
 */
function extractDesiredTraits(preferences) {
  const traits = new Set();

  // 从陪伴时间提取
  const companionTraits = PREFERENCE_MAPPINGS.companion_time[preferences.companion_time] || [];
  companionTraits.forEach(trait => traits.add(trait));

  // 从家庭成员提取
  const familyTraits = PREFERENCE_MAPPINGS.family_members[preferences.family_members] || [];
  familyTraits.forEach(trait => traits.add(trait));

  // 从活跃程度提取
  const activityTraits = PREFERENCE_MAPPINGS.activity_level[preferences.activity_level] || [];
  activityTraits.forEach(trait => traits.add(trait));

  return Array.from(traits);
}

/**
 * 阶段1: 应用硬性条件过滤
 */
function buildHardFilterQuery(preferences) {
  let query = supabase
    .from('dogs')
    .select('*')
    .eq('status', 'available');

  // 根据居住空间过滤体型
  const allowedSizes = PREFERENCE_MAPPINGS.living_space[preferences.living_space];
  if (allowedSizes && allowedSizes.length > 0) {
    query = query.in('size', allowedSizes);
  }

  // 根据美容意愿过滤毛发类型
  const coatTypeFilter = PREFERENCE_MAPPINGS.grooming_tolerance[preferences.grooming_tolerance];
  if (coatTypeFilter) {
    query = query.eq('coat_type', coatTypeFilter);
  }

  return query;
}

/**
 * 阶段2: 计算单只宠物的匹配分数
 */
function calculateMatchScore(dog, desiredTraits) {
  let score = 0;
  const matchReasons = [];

  // 性格特征匹配度(每匹配1个+20分)
  const dogTraits = Array.isArray(dog.traits) ? dog.traits : [];
  desiredTraits.forEach(trait => {
    if (dogTraits.includes(trait)) {
      score += 20;
      matchReasons.push(`性格匹配: ${trait}`);
    }
  });

  // 年龄加分(幼年宠物更易适应新环境)
  if (dog.age < 2) {
    score += 10;
    matchReasons.push('年轻易适应');
  } else if (dog.age < 6) {
    score += 5;
  }

  // 健康状态加分
  if (dog.is_vaccinated) {
    score += 5;
    matchReasons.push('已疫苗接种');
  }
  if (dog.is_sterilized) {
    score += 5;
    matchReasons.push('已绝育');
  }

  // 转换为百分比(满分100分)
  const matchPercentage = Math.min(100, score);

  return {
    score,
    matchPercentage,
    matchReasons: matchReasons.slice(0, 3)  // 最多返回3个原因
  };
}

/**
 * 主函数: 计算推荐宠物列表
 */
async function calculateRecommendations(preferences) {
  try {
    // 阶段1: 硬性条件过滤
    const query = buildHardFilterQuery(preferences);
    const { data: filteredDogs, error } = await query;

    if (error) throw error;

    // 如果没有匹配结果,返回空数组
    if (!filteredDogs || filteredDogs.length === 0) {
      return {
        success: true,
        recommendations: [],
        totalMatches: 0,
        message: '暂无符合条件的宠物,请调整筛选条件'
      };
    }

    // 阶段2: 计算每只宠物的匹配度
    const desiredTraits = extractDesiredTraits(preferences);
    const dogsWithScores = filteredDogs.map(dog => {
      const { score, matchPercentage, matchReasons } = calculateMatchScore(dog, desiredTraits);
      return {
        ...dog,
        matchScore: score,
        matchPercentage,
        matchReasons
      };
    });

    // 按匹配度降序排序
    dogsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    // 返回Top 5推荐
    const topRecommendations = dogsWithScores.slice(0, 5);

    return {
      success: true,
      recommendations: topRecommendations,
      totalMatches: filteredDogs.length
    };
  } catch (error) {
    console.error('计算推荐失败:', error);

    // 降级方案: 返回最新发布的5只宠物
    try {
      const { data: fallbackDogs } = await supabase
        .from('dogs')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        success: false,
        recommendations: fallbackDogs || [],
        totalMatches: fallbackDogs?.length || 0,
        error: '推荐计算失败,显示最新宠物'
      };
    } catch (fallbackError) {
      return {
        success: false,
        recommendations: [],
        totalMatches: 0,
        error: '推荐服务暂时不可用'
      };
    }
  }
}

module.exports = {
  calculateRecommendations,
  extractDesiredTraits,
  calculateMatchScore,
  PREFERENCE_MAPPINGS
};
