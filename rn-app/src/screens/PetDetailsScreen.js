import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fetchPetDetails,
  fetchRelatedTopics,
  fetchReviewEligibility,
  fetchReviews,
  togglePetFavorite,
} from '../services/api';
import { getAuthToken, getAuthUserId } from '../services/auth';

const traitList = [
  { icon: 'verified_user', text: '已接种疫苗', highlight: true },
  { icon: 'check_circle', text: '已绝育' },
  { icon: 'mood', text: '性格亲人' },
  { icon: 'house', text: '定点入厕' },
];

function topicPreview(topic) {
  const content = topic?.content || '';
  return content.length > 56 ? `${content.slice(0, 56)}...` : content;
}

export default function PetDetailsScreen({
  petId,
  onOpenForumTopic,
  onOpenForumList,
  onOpenApply,
  onConsult,
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [pet, setPet] = useState(null);
  const [relatedTopics, setRelatedTopics] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewEligibility, setReviewEligibility] = useState({ eligible: false });

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [favoriting, setFavoriting] = useState(false);

  const title = useMemo(() => {
    if (!pet) return `宠物 #${petId}`;
    return `${pet.name || '未命名宠物'}${pet.age ? `, ${pet.age}` : ''}`;
  }, [pet, petId]);

  const subtitle = useMemo(() => {
    const gender = pet?.gender || '公';
    const breed = pet?.breed || '汪星人';
    return `${gender} • ${breed}`;
  }, [pet]);

  const loadAllData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const [authToken, authUserId] = await Promise.all([getAuthToken(), getAuthUserId()]);
      setToken(authToken || null);
      setUserId(authUserId || null);

      const [petPayload, topicsPayload, reviewsPayload, eligibilityPayload] = await Promise.all([
        fetchPetDetails(petId, authToken),
        fetchRelatedTopics(petId, authToken),
        fetchReviews(petId, authToken),
        fetchReviewEligibility(petId, authToken).catch(() => ({ eligible: false })),
      ]);

      setPet(petPayload?.dog || petPayload?.data || petPayload || null);
      setRelatedTopics(Array.isArray(topicsPayload) ? topicsPayload : topicsPayload?.items || []);
      setReviews(Array.isArray(reviewsPayload?.reviews) ? reviewsPayload.reviews : []);
      setReviewEligibility(eligibilityPayload || { eligible: false });
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData({ silent: true });
  };

  const handleFavorite = async () => {
    try {
      setFavoriting(true);
      const result = await togglePetFavorite(petId, { token, userId });
      const statusText = result?.status === 'added' ? '已加入收藏' : '已取消收藏';
      Alert.alert('收藏状态更新', statusText);
      await loadAllData({ silent: true });
    } catch (err) {
      if (String(err.message || '') === 'NOT_AUTHENTICATED') {
        Alert.alert('请先登录', '请从主 App 打开时携带 token 和 userId。');
        return;
      }
      Alert.alert('收藏失败', err.message || '请稍后重试');
    } finally {
      setFavoriting(false);
    }
  };

  const handleOpenTopic = (topic) => {
    if (typeof onOpenForumTopic === 'function') {
      onOpenForumTopic(topic);
      return;
    }
    Alert.alert('提示', `当前试点未接入帖子跳转（topicId=${topic?.id}）`);
  };

  const handleOpenForumList = () => {
    if (typeof onOpenForumList === 'function') {
      onOpenForumList({ petId, petName: pet?.name });
      return;
    }
    Alert.alert('提示', '当前试点未接入论坛列表跳转');
  };

  const handleApply = () => {
    if (typeof onOpenApply === 'function') {
      onOpenApply({ petId, pet });
      return;
    }
    Alert.alert('领养申请', '当前试点未接入申请页跳转');
  };

  const handleConsult = () => {
    if (typeof onConsult === 'function') {
      onConsult({ petId, pet });
      return;
    }
    Alert.alert('咨询', '当前试点未接入咨询入口');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.hintText}>正在加载宠物信息...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>加载失败：{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadAllData()}>
            <Text style={styles.retryText}>重试</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroWrap}>
          <Image
            source={{
              uri:
                pet?.image ||
                'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
            }}
            style={styles.hero}
          />
          <View style={styles.heroMask} />
          <View style={styles.topActions}>
            <View style={styles.topActionsSpacer} />
            <Pressable onPress={handleFavorite} style={styles.topBtn} disabled={favoriting}>
              <Text style={styles.topBtnText}>{favoriting ? '...' : '♥'}</Text>
            </Pressable>
          </View>
          <View style={styles.heroDots}>
            <View style={styles.heroDotActive} />
            <View style={styles.heroDot} />
            <View style={styles.heroDot} />
            <View style={styles.heroDot} />
          </View>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.petBadge}>
              <Text style={styles.petBadgeIcon}>🐾</Text>
            </View>
          </View>

          <View style={styles.traitsWrap}>
            {traitList.map((trait) => (
              <View key={trait.text} style={[styles.traitItem, trait.highlight ? styles.traitItemHighlight : null]}>
                <Text style={styles.traitIcon}>{trait.icon}</Text>
                <Text style={[styles.traitText, trait.highlight ? styles.traitTextHighlight : null]}>{trait.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>关于我</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.bodyText}>
                {pet?.name || '这只小狗'}性格温柔，最喜欢在公园里悠闲散步，也特别享受被摸肚子的时光。他与孩子和其他狗狗都能和谐相处，是陪伴家庭成长的完美伙伴。{"\n\n"}
                他已经掌握了一些基本指令，不过偶尔会有点小调皮！{pet?.name || '他'}正在寻找一个永远的家，希望成为你最忠诚的伴侣。
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>相关讨论 {relatedTopics.length > 0 ? `(${relatedTopics.length})` : ''}</Text>
            {relatedTopics.length === 0 ? (
              <View style={styles.sectionBody}>
                <Text style={styles.emptyText}>暂无相关讨论</Text>
              </View>
            ) : (
              <View style={styles.topicList}>
                {relatedTopics.slice(0, 3).map((topic) => (
                  <Pressable key={String(topic.id)} style={styles.topicItem} onPress={() => handleOpenTopic(topic)}>
                    <Text style={styles.topicTitle} numberOfLines={1}>{topic.title}</Text>
                    <Text style={styles.topicPreview} numberOfLines={2}>{topicPreview(topic)}</Text>
                    <Text style={styles.topicMeta}>{topic.author_name || '匿名用户'} · 评论 {topic.comment_count || 0}</Text>
                  </Pressable>
                ))}
                {relatedTopics.length > 3 ? (
                  <Pressable style={styles.moreTopicBtn} onPress={handleOpenForumList}>
                    <Text style={styles.moreTopicText}>查看全部 {relatedTopics.length} 个讨论 →</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>领养评价 ({reviews.length})</Text>
            <Text style={styles.eligibilityText}>
              {reviewEligibility?.eligible
                ? '你有资格评价这只宠物（RN 试点页暂未开放发评价表单）'
                : reviewEligibility?.message || '当前账号暂无评价资格'}
            </Text>
            {reviews.length === 0 ? (
              <Text style={styles.emptyText}>暂无评价</Text>
            ) : (
              reviews.slice(0, 6).map((review) => (
                <View key={String(review.id)} style={styles.reviewItem}>
                  <Text style={styles.reviewMeta}>
                    {review.username || '匿名用户'} · 评分 {review.rating || '-'} / 5
                  </Text>
                  <Text style={styles.reviewContent}>{review.content || ''}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={styles.consultBtn} onPress={handleConsult}>
          <Text style={styles.consultBtnIcon}>💬</Text>
          <Text style={styles.consultBtnText}>咨询</Text>
        </Pressable>
        <Pressable style={styles.applyBtn} onPress={handleApply}>
          <Text style={styles.applyBtnText}>领养我 ♥</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  hintText: {
    color: '#6b7280',
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#f97316',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    paddingBottom: 120,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#f3ebe7',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActionsSpacer: {
    width: 40,
    height: 40,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  topBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  heroDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  heroDotActive: {
    width: 26,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#fff',
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  mainCard: {
    marginTop: -18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#fffaf5',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1b120e',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 17,
    color: '#97674e',
    fontWeight: '700',
  },
  petBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff0dd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petBadgeIcon: {
    fontSize: 22,
  },
  traitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderColor: '#e5ded9',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  traitItemHighlight: {
    borderColor: '#f59e0b55',
    backgroundColor: '#fff5e7',
  },
  traitIcon: {
    fontSize: 12,
    color: '#5c4033',
  },
  traitText: {
    color: '#1b120e',
    fontSize: 12,
    fontWeight: '700',
  },
  traitTextHighlight: {
    color: '#be5a0e',
  },
  section: {
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1b120e',
    marginBottom: 10,
  },
  sectionBody: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5ded9',
    padding: 14,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5c4033',
    fontWeight: '500',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  topicList: {
    gap: 8,
  },
  topicItem: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5ded9',
    padding: 12,
    gap: 4,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b120e',
  },
  topicPreview: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  topicMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  moreTopicBtn: {
    alignSelf: 'stretch',
    paddingVertical: 8,
    alignItems: 'center',
  },
  moreTopicText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
  },
  eligibilityText: {
    fontSize: 13,
    color: '#9a3412',
    marginBottom: 8,
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
    marginTop: 2,
  },
  reviewMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  reviewContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5ded9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
  },
  consultBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f7efe8',
    borderWidth: 1,
    borderColor: '#e5ded9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultBtnIcon: {
    fontSize: 18,
  },
  consultBtnText: {
    marginTop: 2,
    fontSize: 10,
    color: '#1b120e',
    fontWeight: '800',
  },
  applyBtn: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
