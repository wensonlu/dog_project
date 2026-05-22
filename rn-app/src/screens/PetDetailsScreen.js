import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
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
  { icon: '💉', text: '已接种疫苗' },
  { icon: '✅', text: '已绝育' },
  { icon: '😊', text: '性格亲人' },
  { icon: '🏠', text: '定点入厕' },
];

export default function PetDetailsScreen({ petId, onBack }) {
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
  const [favoriteStatus, setFavoriteStatus] = useState('');
  const handleCopyError = useCallback(async () => {
    await Share.share({ message: `加载失败：${error}` });
  }, [error]);

  const title = useMemo(() => {
    if (!pet) return `宠物 #${petId}`;
    return `${pet.name || '未命名宠物'}${pet.age ? `, ${pet.age}` : ''}`;
  }, [pet, petId]);

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
      setFavoriteStatus(statusText);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Text style={styles.iconText}>返回</Text>
        </Pressable>
        <Pressable onPress={handleFavorite} style={styles.iconBtn} disabled={favoriting}>
          <Text style={styles.iconText}>{favoriting ? '处理中' : '收藏'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.hintText}>正在加载宠物信息...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>加载失败：{error}</Text>
          <View style={styles.errorActions}>
            <Pressable style={styles.retryBtn} onPress={() => loadAllData()}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
            <Pressable style={styles.copyBtn} onPress={handleCopyError}>
              <Text style={styles.retryText}>复制</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Image
            source={{
              uri:
                pet?.image ||
                'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
            }}
            style={styles.hero}
          />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{pet?.breed || '汪星人'} · {pet?.location || '待补充地点'}</Text>
          {!!favoriteStatus && <Text style={styles.favoriteHint}>{favoriteStatus}</Text>}

          <View style={styles.traitsWrap}>
            {traitList.map((trait) => (
              <View key={trait.text} style={styles.traitItem}>
                <Text>{trait.icon}</Text>
                <Text style={styles.traitText}>{trait.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>关于我</Text>
            <Text style={styles.cardText}>
              {pet?.name || '这只小狗'}性格温柔，喜欢散步，也喜欢被摸摸肚子。和孩子与其他狗狗相处友好，
              正在寻找一个稳定、温暖、愿意长期陪伴的家庭。
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>相关讨论 ({relatedTopics.length})</Text>
            {relatedTopics.length === 0 ? (
              <Text style={styles.emptyText}>暂无相关讨论</Text>
            ) : (
              relatedTopics.slice(0, 5).map((topic) => (
                <View key={String(topic.id)} style={styles.topicItem}>
                  <Text style={styles.topicTitle} numberOfLines={1}>{topic.title}</Text>
                  <Text style={styles.topicMeta} numberOfLines={1}>
                    {topic.author_name || '匿名用户'} · 评论 {topic.comment_count || 0}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>领养评价 ({reviews.length})</Text>
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
                    {(review.username || '匿名用户')} · 评分 {review.rating || '-'} / 5
                  </Text>
                  <Text style={styles.reviewContent}>{review.content || ''}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
  },
  iconText: {
    color: '#ffffff',
    fontWeight: '600',
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
  errorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
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
  copyBtn: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#6b7280',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  hero: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#9a3412',
    fontWeight: '600',
  },
  favoriteHint: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  traitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderColor: '#fed7aa',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  traitText: {
    color: '#7c2d12',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  emptyText: {
    color: '#6b7280',
  },
  topicItem: {
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  topicMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  eligibilityText: {
    fontSize: 13,
    color: '#9a3412',
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
});
