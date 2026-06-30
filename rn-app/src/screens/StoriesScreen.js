import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchStories } from '../services/api';

const PAGE_SIZE = 10;
const fallbackImage = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600';

export default function StoriesScreen({ onOpenStory, onOpenWeb }) {
  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (nextPage, replace = false) => {
    try {
      setError('');
      const payload = await fetchStories(nextPage, PAGE_SIZE);
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setStories((current) => replace ? list : [...current, ...list]);
      setPage(nextPage);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>幸福故事</Text>
          <Text style={styles.subtitle}>每一个领养都是爱的延续</Text>
        </View>
        <Pressable style={styles.shareBtn} onPress={() => onOpenWeb('/stories/create')}>
          <Text style={styles.shareText}>分享</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#e56d63" style={styles.center} />
      ) : (
        <FlatList
          data={stories}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadPage(1, true);
              }}
            />
          }
          onEndReached={() => {
            if (!hasMore || loadingMore) return;
            setLoadingMore(true);
            loadPage(page + 1);
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<Text style={styles.empty}>{error || '还没有故事'}</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#e56d63" /> : null}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => onOpenStory(item.id)}>
              <Image source={{ uri: item.cover_image || item?.dog?.image || fallbackImage }} style={styles.image} />
              <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
              <Text numberOfLines={1} style={styles.author}>{item?.adopter?.full_name || '匿名用户'}</Text>
              <Text style={styles.stats}>赞 {item.like_count || 0}  评论 {item.comment_count || 0}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  headerText: { flex: 1 },
  title: { color: '#241914', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#8c7969', fontSize: 11, marginTop: 3 },
  shareBtn: { borderRadius: 12, backgroundColor: '#e56d63', paddingHorizontal: 13, paddingVertical: 9 },
  shareText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  center: { flex: 1 },
  list: { padding: 12, paddingBottom: 28 },
  row: { gap: 10 },
  card: { flex: 1, marginBottom: 10, borderRadius: 15, backgroundColor: '#fffdf9', overflow: 'hidden', paddingBottom: 10 },
  image: { width: '100%', height: 150, backgroundColor: '#eadfd2' },
  cardTitle: { color: '#30231e', fontSize: 14, fontWeight: '800', marginHorizontal: 10, marginTop: 9 },
  author: { color: '#8c7969', fontSize: 11, marginHorizontal: 10, marginTop: 6 },
  stats: { color: '#b19d8b', fontSize: 10, marginHorizontal: 10, marginTop: 7 },
  empty: { color: '#8c7969', textAlign: 'center', marginTop: 80 },
});
