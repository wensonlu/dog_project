import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchStories, fetchWikiArticles } from '../services/api';

const fallbackImage = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600';

export default function ContentHubScreen({ onOpenStories, onOpenStory, onOpenWeb }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [articles, setArticles] = useState([]);
  const [stories, setStories] = useState([]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [articlePayload, storyPayload] = await Promise.all([
        fetchWikiArticles(4),
        fetchStories(1, 4),
      ]);
      setArticles(Array.isArray(articlePayload?.data) ? articlePayload.data : []);
      setStories(Array.isArray(storyPayload?.data) ? storyPayload.data : []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData({ silent: true });
            }}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>内容中心</Text>
          <Text style={styles.subtitle}>百科知识与领养故事，一站查看</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#e56d63" style={styles.loading} />
        ) : error ? (
          <Pressable style={styles.errorCard} onPress={() => loadData()}>
            <Text style={styles.errorText}>{error}，点击重试</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>百科精选</Text>
                <Pressable onPress={() => onOpenWeb('/wiki')}>
                  <Text style={styles.more}>查看更多</Text>
                </Pressable>
              </View>
              {articles.length === 0 ? (
                <Text style={styles.empty}>暂无百科内容</Text>
              ) : articles.map((article) => (
                <Pressable
                  key={String(article.id)}
                  style={styles.articleCard}
                  onPress={() => onOpenWeb(`/wiki/article/${article.slug}`)}
                >
                  <Text numberOfLines={1} style={styles.articleTitle}>{article.title}</Text>
                  <Text numberOfLines={1} style={styles.articleSummary}>{article.summary || '查看百科详情'}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>幸福故事</Text>
                <Pressable onPress={onOpenStories}>
                  <Text style={styles.more}>查看更多</Text>
                </Pressable>
              </View>
              {stories.length === 0 ? (
                <Text style={styles.empty}>还没有故事，成为第一个分享者吧</Text>
              ) : (
                <View style={styles.storyGrid}>
                  {stories.map((story) => (
                    <Pressable
                      key={String(story.id)}
                      style={styles.storyCard}
                      onPress={() => onOpenStory(story.id)}
                    >
                      <Image
                        source={{ uri: story.cover_image || story?.dog?.image || fallbackImage }}
                        style={styles.storyImage}
                      />
                      <Text numberOfLines={2} style={styles.storyTitle}>{story.title}</Text>
                      <Text numberOfLines={1} style={styles.storyAuthor}>
                        {story?.adopter?.full_name || '匿名用户'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { padding: 16, paddingBottom: 28 },
  header: { paddingVertical: 12 },
  title: { color: '#241914', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#8c7969', fontSize: 13, marginTop: 5 },
  loading: { marginTop: 80 },
  errorCard: { marginTop: 40, borderRadius: 14, backgroundColor: '#fff', padding: 18 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  section: { backgroundColor: '#fffdf9', borderRadius: 18, padding: 14, marginTop: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#241914', fontSize: 18, fontWeight: '800' },
  more: { color: '#e56d63', fontSize: 13, fontWeight: '700' },
  empty: { color: '#9b8a7b', fontSize: 13, paddingVertical: 12 },
  articleCard: { backgroundColor: '#fff1ef', borderRadius: 12, padding: 12, marginBottom: 8 },
  articleTitle: { color: '#30231e', fontSize: 14, fontWeight: '800' },
  articleSummary: { color: '#8c7969', fontSize: 12, marginTop: 5 },
  storyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  storyCard: { width: '48%', borderRadius: 13, backgroundColor: '#fff7e8', overflow: 'hidden', paddingBottom: 10 },
  storyImage: { width: '100%', height: 110, backgroundColor: '#eadfd2' },
  storyTitle: { color: '#30231e', fontSize: 13, fontWeight: '800', marginHorizontal: 10, marginTop: 9 },
  storyAuthor: { color: '#9b8a7b', fontSize: 11, marginHorizontal: 10, marginTop: 5 },
});
