import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addStoryComment, fetchStoryById, toggleStoryLike } from '../services/api';
import { getAuthToken } from '../services/auth';

const fallbackImage = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900';

export default function StoryDetailScreen({ storyId, onOpenWeb }) {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStory = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setStory(await fetchStoryById(storyId));
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storyId]);

  useEffect(() => {
    loadStory();
  }, [loadStory]);

  const handleLike = async () => {
    try {
      const token = await getAuthToken();
      const result = await toggleStoryLike(storyId, token);
      const delta = result?.status === 'liked' ? 1 : -1;
      setStory((current) => ({
        ...current,
        like_count: Math.max(0, Number(current?.like_count || 0) + delta),
      }));
    } catch (err) {
      if (err?.code === 'NOT_AUTHENTICATED') {
        Alert.alert('请先登录', '即将返回主 App 登录页', [
          { text: '取消', style: 'cancel' },
          { text: '去登录', onPress: () => onOpenWeb('/login') },
        ]);
        return;
      }
      Alert.alert('点赞失败', err.message || '请稍后重试');
    }
  };

  const handleComment = async () => {
    const content = comment.trim();
    if (!content || submitting) return;
    try {
      setSubmitting(true);
      const token = await getAuthToken();
      await addStoryComment(storyId, content, token);
      setComment('');
      await loadStory({ silent: true });
    } catch (err) {
      if (err?.code === 'NOT_AUTHENTICATED') {
        onOpenWeb('/login');
        return;
      }
      Alert.alert('评论失败', err.message || '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#e56d63" style={styles.center} />;
  }

  if (error || !story) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || '故事不存在或已被删除'}</Text>
        <Pressable style={styles.retry} onPress={() => loadStory()}>
          <Text style={styles.retryText}>重试</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStory({ silent: true });
            }}
          />
        }
      >
        <Image source={{ uri: story.cover_image || story?.dog?.image || fallbackImage }} style={styles.cover} />
        <Text style={styles.title}>{story.title}</Text>
        <Text style={styles.author}>
          {story?.adopter?.full_name || '匿名用户'} · {formatDate(story.created_at)}
        </Text>
        <View style={styles.card}><Text style={styles.body}>{story.content || '暂无内容'}</Text></View>

        {Array.isArray(story.timeline) && story.timeline.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>成长记录</Text>
            {story.timeline.map((item, index) => (
              <View key={String(item.id || index)} style={styles.timelineCard}>
                <Text style={styles.timelineDate}>{formatDate(item.milestone_date) || `第 ${index + 1} 条`}</Text>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineBody}>{item.content}</Text>
                {item.image ? <Image source={{ uri: item.image }} style={styles.timelineImage} /> : null}
              </View>
            ))}
          </View>
        )}

        <View style={styles.stats}>
          <Pressable onPress={handleLike}><Text style={styles.statAction}>喜欢 {story.like_count || 0}</Text></Pressable>
          <Text style={styles.stat}>评论 {story.comment_count || 0}</Text>
          <Text style={styles.stat}>浏览 {story.view_count || 0}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>评论</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="写下你的祝福..."
              placeholderTextColor="#b19d8b"
              style={styles.input}
            />
            <Pressable style={styles.sendBtn} onPress={handleComment} disabled={!comment.trim() || submitting}>
              <Text style={styles.sendText}>{submitting ? '发送中' : '发送'}</Text>
            </Pressable>
          </View>
          {(story.comments || []).map((item) => (
            <View key={String(item.id)} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{item?.user?.full_name || '匿名用户'}</Text>
              <Text style={styles.commentBody}>{item.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('zh-CN');
  } catch (_err) {
    return '';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f0' },
  error: { color: '#b91c1c', textAlign: 'center', paddingHorizontal: 20 },
  retry: { marginTop: 14, borderRadius: 10, backgroundColor: '#e56d63', paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '800' },
  content: { paddingHorizontal: 14, paddingBottom: 40 },
  cover: { width: '100%', height: 220, borderRadius: 18, backgroundColor: '#eadfd2' },
  title: { color: '#241914', fontSize: 23, lineHeight: 30, fontWeight: '900', marginTop: 16 },
  author: { color: '#8c7969', fontSize: 12, marginTop: 8 },
  card: { borderRadius: 16, backgroundColor: '#fffdf9', padding: 15, marginTop: 14 },
  body: { color: '#49372e', fontSize: 15, lineHeight: 24 },
  section: { marginTop: 20 },
  sectionTitle: { color: '#241914', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  timelineCard: { borderRadius: 15, backgroundColor: '#fffdf9', padding: 13, marginBottom: 10 },
  timelineDate: { color: '#e56d63', fontSize: 11, fontWeight: '700' },
  timelineTitle: { color: '#30231e', fontSize: 15, fontWeight: '800', marginTop: 7 },
  timelineBody: { color: '#685349', fontSize: 13, lineHeight: 19, marginTop: 5 },
  timelineImage: { width: '100%', height: 160, borderRadius: 11, marginTop: 10 },
  stats: { flexDirection: 'row', gap: 20, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: '#e6ddd4' },
  statAction: { color: '#e56d63', fontSize: 13, fontWeight: '800' },
  stat: { color: '#8c7969', fontSize: 13 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, borderRadius: 12, backgroundColor: '#fffdf9', color: '#30231e', paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { borderRadius: 12, backgroundColor: '#e56d63', justifyContent: 'center', paddingHorizontal: 14 },
  sendText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  commentCard: { borderRadius: 13, backgroundColor: '#fffdf9', padding: 12, marginBottom: 8 },
  commentAuthor: { color: '#30231e', fontSize: 12, fontWeight: '800' },
  commentBody: { color: '#685349', fontSize: 13, lineHeight: 19, marginTop: 5 },
});
