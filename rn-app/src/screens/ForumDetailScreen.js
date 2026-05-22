import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { fetchForumTopicById } from '../services/api';
import { getAuthToken, getAuthUserId } from '../services/auth';

const screenWidth = Dimensions.get('window').width;

export default function ForumDetailScreen({ topicId }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const [token, userId] = await Promise.all([getAuthToken(), getAuthUserId()]);
      const payload = await fetchForumTopicById(topicId, { token, userId });
      setTopic(payload?.topic || null);
      setComments(Array.isArray(payload?.comments) ? payload.comments : []);
      setImageIndex(0);
    } catch (err) {
      if (err?.code === 'UNAUTHORIZED') {
        setError('登录态失效，请从主 App 重新进入详情页');
      } else if (err?.code === 'REQUEST_TIMEOUT') {
        setError('请求超时，请下拉或点击重试');
      } else if (err?.code === 'NETWORK_ERROR') {
        setError('网络异常，请检查网络后重试');
      } else {
        setError(err.message || '加载失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [topicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData({ silent: true });
  };

  const summary = useMemo(() => {
    if (!topic) return '';
    return `${topic.views || 0} 浏览 · ${topic.likes || 0} 点赞 · ${topic.comments || 0} 评论`;
  }, [topic]);

  const images = Array.isArray(topic?.images) ? topic.images : [];
  const hasImages = images.length > 0;

  const handleCopyError = useCallback(async () => {
    await Share.share({ message: `加载失败: ${error}` });
  }, [error]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#e67e22" />
          <Text style={styles.hintText}>正在加载帖子详情...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>加载失败: {error}</Text>
          <View style={styles.errorActions}>
            <Pressable style={styles.retryBtn} onPress={() => loadData()}>
              <Text style={styles.retryBtnText}>重试</Text>
            </Pressable>
            <Pressable style={styles.copyBtn} onPress={handleCopyError}>
              <Text style={styles.copyBtnText}>复制</Text>
            </Pressable>
          </View>
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
        {hasImages && (
          <View style={styles.heroWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const x = event.nativeEvent.contentOffset.x;
                const index = Math.round(x / screenWidth);
                setImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.map((image, index) => (
                <Image key={`${image}-${index}`} source={{ uri: image }} style={styles.heroImage} />
              ))}
            </ScrollView>

            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{imageIndex + 1}/{images.length}</Text>
            </View>

            {images.length > 1 && (
              <View style={styles.dotsWrap}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, index === imageIndex ? styles.dotActive : null]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.mainCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar} />
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>{topic?.author?.name || '匿名用户'}</Text>
              <Text style={styles.authorSub}>{topic?.category || '论坛'} · {summary}</Text>
            </View>
            <View style={styles.followBtn}>
              <Text style={styles.followBtnText}>关注</Text>
            </View>
          </View>

          <Text style={styles.title}>{topic?.title || `帖子 #${topicId}`}</Text>
          <Text style={styles.body}>{topic?.content || '暂无内容'}</Text>

          {(topic?.tags || []).length > 0 && (
            <View style={styles.tagsWrap}>
              {topic.tags.map((tag) => (
                <View key={String(tag)} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.commentHeader}>
          <Text style={styles.commentHeaderText}>共 {comments.length} 条评论</Text>
        </View>

        {comments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>暂无评论，快来抢沙发吧</Text>
          </View>
        ) : (
          comments.map((comment) => (
            <View key={String(comment.id)} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{comment?.author?.name || '匿名用户'}</Text>
              <Text style={styles.commentBody}>{comment?.content || ''}</Text>
              <Text style={styles.commentStat}>👍 {comment?.likes || 0} · 回复 {(comment?.replies || []).length}</Text>

              {(comment?.replies || []).map((reply) => (
                <View key={String(reply.id)} style={styles.replyCard}>
                  <Text style={styles.replyAuthor}>{reply?.author?.name || '匿名用户'}</Text>
                  <Text style={styles.replyBody}>{reply?.content || ''}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5ef',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  hintText: {
    color: '#8b6b4a',
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
    borderRadius: 8,
    backgroundColor: '#ea7a1b',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  copyBtn: {
    borderRadius: 8,
    backgroundColor: '#6b7280',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 24,
  },
  heroWrap: {
    width: screenWidth,
    height: Math.round(screenWidth * 1.18),
    backgroundColor: '#0f0f0f',
    position: 'relative',
  },
  heroImage: {
    width: screenWidth,
    height: Math.round(screenWidth * 1.18),
    resizeMode: 'cover',
  },
  imageCounter: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#fff',
  },
  mainCard: {
    marginTop: -10,
    marginHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#fffdf9',
    borderWidth: 1,
    borderColor: '#f4e6d5',
    padding: 14,
    gap: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e8ddd0',
  },
  authorMeta: {
    flex: 1,
    marginLeft: 10,
    gap: 2,
  },
  authorName: {
    color: '#1b120e',
    fontSize: 14,
    fontWeight: '700',
  },
  authorSub: {
    color: '#8b6b4a',
    fontSize: 12,
  },
  followBtn: {
    borderRadius: 99,
    backgroundColor: '#ea7a1b',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#1b120e',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  body: {
    color: '#3d2b1f',
    fontSize: 15,
    lineHeight: 23,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    borderRadius: 10,
    backgroundColor: '#fff2df',
    borderWidth: 1,
    borderColor: '#f6d7ac',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tagText: {
    color: '#bf6b1e',
    fontSize: 12,
    fontWeight: '600',
  },
  commentHeader: {
    marginTop: 12,
    marginBottom: 6,
    marginHorizontal: 14,
  },
  commentHeaderText: {
    color: '#1b120e',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    marginHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f4e6d5',
    backgroundColor: '#fffdf9',
    padding: 14,
  },
  emptyText: {
    color: '#8b6b4a',
  },
  commentCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f4e6d5',
    backgroundColor: '#fffdf9',
    padding: 12,
    gap: 6,
  },
  commentAuthor: {
    color: '#1b120e',
    fontSize: 13,
    fontWeight: '700',
  },
  commentBody: {
    color: '#3d2b1f',
    fontSize: 14,
    lineHeight: 20,
  },
  commentStat: {
    color: '#8b6b4a',
    fontSize: 12,
  },
  replyCard: {
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f2e9dd',
    backgroundColor: '#fff8ef',
    padding: 10,
    gap: 4,
  },
  replyAuthor: {
    color: '#5f4430',
    fontSize: 12,
    fontWeight: '700',
  },
  replyBody: {
    color: '#6a4a35',
    fontSize: 13,
    lineHeight: 18,
  },
});
