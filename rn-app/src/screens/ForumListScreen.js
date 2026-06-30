import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  fetchForumContext,
  fetchForumSearchSummary,
  fetchForumTopics,
} from '../services/api';
import { getAuthToken, getAuthUserId } from '../services/auth';

const sortOptions = [
  { id: 'latest', name: '最新' },
  { id: 'hot', name: '最热' },
  { id: 'comments', name: '最多评论' },
];

const categories = [
  { id: 'all', name: '推荐' },
  { id: 'adoption', name: '领养经验' },
  { id: 'daily', name: '日常分享' },
  { id: 'question', name: '求助问答' },
  { id: 'help', name: '求助问答' },
];

function previewText(text) {
  return String(text || '').replace(/\s+/g, ' ').slice(0, 76);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ForumListScreen({ onOpenTopic, onOpenWeb }) {
  const [topics, setTopics] = useState([]);
  const [selectedSort, setSelectedSort] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [contextSummary, setContextSummary] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTopics = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const [token, userId] = await Promise.all([getAuthToken(), getAuthUserId()]);
      const payload = await fetchForumTopics({
        category: selectedCategory === 'question' ? 'help' : selectedCategory,
        sort: selectedSort,
        query: searchQuery,
        userId,
        token,
      });
      const items = Array.isArray(payload) ? payload : (payload?.items || []);
      setTopics(items);

      fetchForumContext({
        sort: selectedSort,
        category: selectedCategory,
        query: searchQuery,
        userId,
        token,
      })
        .then((ctx) => {
          setContextSummary({
            pageType: ctx?.page?.type || 'topic_list',
            totalVisible: ctx?.data?.visibleTopics?.length || items.length,
          });
        })
        .catch(() => {});
    } catch (err) {
      if (err?.code === 'REQUEST_TIMEOUT') {
        setError('请求超时，请下拉重试');
      } else if (err?.code === 'NETWORK_ERROR') {
        setError('网络异常，请检查网络后重试');
      } else {
        setError(err?.message || '加载失败，请稍后再试');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedSort, searchQuery]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    let cancelled = false;
    const query = searchQuery.trim();
    if (query.length < 2) {
      setAiSummary(null);
      setAiSummaryLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setAiSummaryLoading(true);
    getAuthToken()
      .then((token) => fetchForumSearchSummary(query, { token }))
      .then((data) => {
        if (!cancelled) setAiSummary(data);
      })
      .catch(() => {
        if (!cancelled) setAiSummary(null);
      })
      .finally(() => {
        if (!cancelled) setAiSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTopics({ silent: true });
  };

  const hasSearch = searchQuery.trim().length > 0;
  const emptyText = hasSearch ? '没有找到相关话题' : '暂无话题，来做第一个分享的人吧';

  const waterfallColumns = useMemo(() => topics.reduce((columns, topic, index) => {
    columns[index % 2].push({ topic, index });
    return columns;
  }, [[], []]), [topics]);

  const renderTopic = (topic, index) => {
    const image = Array.isArray(topic.images) ? topic.images[0] : null;
    const imageCount = Array.isArray(topic.images) ? topic.images.length : 0;
    return (
      <Pressable key={String(topic.id)} style={styles.topicCard} onPress={() => onOpenTopic?.(topic.id)}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={[
              styles.topicImage,
              imageCount > 1 || index % 3 === 0 ? styles.topicImageTall : styles.topicImageShort,
            ]}
          />
        ) : null}
        <View style={styles.topicBody}>
          <View style={styles.topicMetaRow}>
            <Text style={styles.category}>{topic.category || '社区'}</Text>
            <Text style={styles.time}>{formatTime(topic.createdAt)}</Text>
          </View>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.topicPreview}>{previewText(topic.content)}</Text>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{topic?.author?.name || '匿名用户'}</Text>
            <Text style={styles.stats}>赞 {topic.likes || 0} 评 {topic.comments || 0}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const summaryLines = useMemo(() => {
    if (!aiSummary) return [];
    if (Array.isArray(aiSummary.keyPoints)) return aiSummary.keyPoints;
    if (Array.isArray(aiSummary.summary)) return aiSummary.summary;
    if (typeof aiSummary.summary === 'string') return [aiSummary.summary];
    if (typeof aiSummary.answer === 'string') return [aiSummary.answer];
    return [];
  }, [aiSummary]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          <View>
            <Text style={styles.eyebrow}>温暖交流</Text>
            <Text style={styles.title}>汪友社区</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.iconBtn} onPress={() => onOpenWeb?.('/forum/history')}>
              <Text style={styles.iconText}>历</Text>
            </Pressable>
            <Pressable style={[styles.iconBtn, styles.createBtn]} onPress={() => onOpenWeb?.('/forum/create')}>
              <Text style={[styles.iconText, styles.createText]}>写</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="搜索暖心话题..."
            placeholderTextColor="#b98b72"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchInput ? (
            <Pressable style={styles.clearBtn} onPress={() => setSearchInput('')}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {sortOptions.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.tab, selectedSort === item.id ? styles.tabActive : null]}
              onPress={() => setSelectedSort(item.id)}
            >
              <Text style={[styles.tabText, selectedSort === item.id ? styles.tabTextActive : null]}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.filterLabel}>按话题分类筛选</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.categoryPill, selectedCategory === item.id ? styles.categoryPillActive : null]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === item.id ? styles.categoryTextActive : null]}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {contextSummary ? (
          <Text style={styles.contextText}>AI上下文已同步：{contextSummary.pageType} · 可见话题 {contextSummary.totalVisible}</Text>
        ) : null}

        {searchQuery.length >= 2 ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>AI 搜索摘要</Text>
            {aiSummaryLoading ? (
              <Text style={styles.aiBody}>生成中...</Text>
            ) : summaryLines.length > 0 ? (
              summaryLines.slice(0, 3).map((line, index) => (
                <Text key={`${line}-${index}`} style={styles.aiBody}>• {line}</Text>
              ))
            ) : (
              <Text style={styles.aiBody}>暂无摘要，换个关键词试试。</Text>
            )}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.hintText}>加载温暖话题中...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadTopics()}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{emptyText}</Text>
            {hasSearch ? (
              <Pressable onPress={() => setSearchInput('')}><Text style={styles.emptyAction}>清除搜索</Text></Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.waterfallGrid}>
            {waterfallColumns.map((column, columnIndex) => (
              <View key={`waterfall-column-${columnIndex}`} style={styles.waterfallColumn}>
                {column.map(({ topic, index }) => renderTopic(topic, index))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5fbf8' },
  content: { padding: 14, paddingBottom: 28 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  title: { marginTop: 3, color: '#13211d', fontSize: 26, fontWeight: '900' },
  heroActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe4e6',
  },
  createBtn: { backgroundColor: '#fb7185' },
  iconText: { color: '#be123c', fontSize: 15, fontWeight: '900' },
  createText: { color: '#fff' },
  searchWrap: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1c7b6',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: '#241914', fontSize: 14 },
  clearBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: '#be123c', fontSize: 22, fontWeight: '600' },
  tabRow: { gap: 8, paddingTop: 12, paddingBottom: 8 },
  tab: {
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#d7e8e1',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  tabText: { color: '#40534d', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: '#fff' },
  filterLabel: { marginTop: 2, marginBottom: 6, color: '#69776f', fontSize: 11, fontWeight: '700' },
  categoryRow: { gap: 8, paddingBottom: 8 },
  categoryPill: {
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#eaded1',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryPillActive: { backgroundColor: '#fff1dd', borderColor: '#f2b26f' },
  categoryText: { color: '#73594a', fontSize: 12, fontWeight: '800' },
  categoryTextActive: { color: '#b45309' },
  contextText: { marginTop: 2, color: '#0f766e', fontSize: 11, fontWeight: '700' },
  aiCard: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfe9e1',
    backgroundColor: '#ecfdf5',
    padding: 12,
    gap: 5,
  },
  aiTitle: { color: '#0f766e', fontSize: 14, fontWeight: '900' },
  aiBody: { color: '#36524a', fontSize: 12, lineHeight: 18 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  hintText: { color: '#7b6a5d', fontSize: 13 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  retryBtn: { marginTop: 4, borderRadius: 8, backgroundColor: '#fb7185', paddingHorizontal: 18, paddingVertical: 9 },
  retryText: { color: '#fff', fontWeight: '800' },
  emptyCard: { alignItems: 'center', paddingVertical: 44, gap: 10 },
  emptyTitle: { color: '#6f625a', fontSize: 14, fontWeight: '700' },
  emptyAction: { color: '#e11d48', fontSize: 13, fontWeight: '900' },
  waterfallGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  waterfallColumn: { flex: 1, gap: 10 },
  topicCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8ddd0',
    backgroundColor: '#fffdf9',
    overflow: 'hidden',
  },
  topicImage: { width: '100%', backgroundColor: '#efe5dc' },
  topicImageTall: { height: 184 },
  topicImageShort: { height: 136 },
  topicBody: { padding: 12, gap: 7 },
  topicMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { color: '#0f766e', fontSize: 11, fontWeight: '900' },
  time: { color: '#9a8d82', fontSize: 11, fontWeight: '600' },
  topicTitle: { color: '#241914', fontSize: 16, fontWeight: '900', lineHeight: 21 },
  topicPreview: { color: '#5f5149', fontSize: 13, lineHeight: 19 },
  authorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorName: { color: '#5e4c41', fontSize: 12, fontWeight: '800' },
  stats: { color: '#8b6b4a', fontSize: 12, fontWeight: '700' },
});
