import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  confirmForumReply,
  deleteForumComment,
  deleteForumReply,
  deleteForumTopic,
  draftForumReply,
  fetchForumTopicAiKit,
  fetchForumTopicById,
  precheckForumReply,
  toggleForumAuthorFollow,
  toggleForumCommentLike,
  toggleForumReplyLike,
  toggleForumTopicLike,
} from '../services/api';
import { getAuthToken, getAuthUserId } from '../services/auth';

const screenWidth = Dimensions.get('window').width;

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

function errorMessage(err) {
  if (err?.code === 'UNAUTHORIZED') return '登录态失效，请从主 App 重新进入详情页';
  if (err?.code === 'REQUEST_TIMEOUT') return '请求超时，请下拉或点击重试';
  if (err?.code === 'NETWORK_ERROR') return '网络异常，请检查网络后重试';
  return err?.message || '操作失败';
}

export default function ForumDetailScreen({ topicId, onOpenWeb }) {
  const scrollViewRef = useRef(null);
  const composerInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState(null);
  const [comments, setComments] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [authorFollowers, setAuthorFollowers] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [draftingReply, setDraftingReply] = useState(false);
  const [aiKitLoading, setAiKitLoading] = useState(false);
  const [aiKit, setAiKit] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const composerKeyboardLift = Platform.OS === 'ios' ? Math.max(0, keyboardHeight - 12) : 0;

  const getAuth = useCallback(async () => {
    const [token, userId] = await Promise.all([getAuthToken(), getAuthUserId()]);
    return { token, userId };
  }, []);

  const requireAuth = useCallback(async () => {
    const auth = await getAuth();
    if (!auth.userId) {
      throw new Error('请先登录');
    }
    return auth;
  }, [getAuth]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const { token, userId } = await getAuth();
      setCurrentUserId(userId);
      const payload = await fetchForumTopicById(topicId, { token, userId });
      setTopic(payload?.topic || null);
      setComments(Array.isArray(payload?.comments) ? payload.comments : []);
      setImageIndex(0);
      setIsLiked(Boolean(payload?.topic?.isLiked));
      setLikeCount(Number(payload?.topic?.likes || 0));
      setIsFollowingAuthor(Boolean(payload?.topic?.isFollowingAuthor));
      setAuthorFollowers(Number(payload?.topic?.authorFollowers || 0));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuth, topicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    setAiKitLoading(true);
    getAuth()
      .then(({ token }) => fetchForumTopicAiKit(topicId, { token }))
      .then((payload) => {
        if (!cancelled) setAiKit(Array.isArray(payload?.items) ? payload.items : []);
      })
      .catch(() => {
        if (!cancelled) setAiKit([]);
      })
      .finally(() => {
        if (!cancelled) setAiKitLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getAuth, topicId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData({ silent: true });
  };

  const scrollCommentsIntoView = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  const focusComposer = useCallback((replyTarget = null) => {
    if (replyTarget) setReplyingTo(replyTarget);
    scrollCommentsIntoView();
    setTimeout(() => {
      composerInputRef.current?.focus();
    }, 50);
  }, [scrollCommentsIntoView]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const keyboardShowSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(Number(event?.endCoordinates?.height || 0));
      scrollCommentsIntoView();
    });
    const keyboardHideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      keyboardShowSub.remove();
      keyboardHideSub.remove();
    };
  }, [scrollCommentsIntoView]);

  const showError = (message) => Alert.alert('提示', message);

  const summary = useMemo(() => {
    if (!topic) return '';
    return `${topic.views || 0} 浏览 · ${likeCount || 0} 点赞 · ${topic.comments || 0} 评论`;
  }, [topic, likeCount]);

  const images = Array.isArray(topic?.images) ? topic.images : [];
  const hasImages = images.length > 0;
  const isOwnTopic = Boolean(currentUserId && topic?.author?.id && topic.author.id === currentUserId);

  const handleCopyError = useCallback(async () => {
    await Share.share({ message: `加载失败: ${error}` });
  }, [error]);

  const handleLike = async () => {
    try {
      const auth = await requireAuth();
      const next = !isLiked;
      setIsLiked(next);
      setLikeCount((v) => Math.max(0, v + (next ? 1 : -1)));
      const payload = await toggleForumTopicLike(topicId, auth);
      setIsLiked(Boolean(payload?.liked));
      setLikeCount(Number(payload?.likes || 0));
    } catch (err) {
      showError(errorMessage(err));
      loadData({ silent: true });
    }
  };

  const handleFollowAuthor = async () => {
    try {
      const auth = await requireAuth();
      const payload = await toggleForumAuthorFollow(topicId, auth);
      setIsFollowingAuthor(Boolean(payload?.followed));
      setAuthorFollowers(Number(payload?.authorFollowers || 0));
    } catch (err) {
      showError(errorMessage(err));
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const auth = await requireAuth();
      const payload = await toggleForumCommentLike(commentId, auth);
      setComments((prev) => prev.map((comment) => (
        comment.id === commentId ? { ...comment, likes: payload?.likes || 0, isLiked: Boolean(payload?.liked) } : comment
      )));
    } catch (err) {
      showError(errorMessage(err));
    }
  };

  const handleReplyLike = async (replyId) => {
    try {
      const auth = await requireAuth();
      const payload = await toggleForumReplyLike(replyId, auth);
      setComments((prev) => prev.map((comment) => ({
        ...comment,
        replies: (comment.replies || []).map((reply) => (
          reply.id === replyId ? { ...reply, likes: payload?.likes || 0, isLiked: Boolean(payload?.liked) } : reply
        )),
      })));
    } catch (err) {
      showError(errorMessage(err));
    }
  };

  const handleSubmitComment = async () => {
    const content = commentText.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const auth = await requireAuth();
      const precheck = await precheckForumReply({
        topicId,
        content,
        userId: auth.userId,
        replyToCommentId: replyingTo?.commentId ?? replyingTo?.id ?? null,
        replyToUserName: replyingTo?.author?.name,
        token: auth.token,
      });
      await confirmForumReply({ confirmToken: precheck?.confirmToken, ...auth });
      setCommentText('');
      setReplyingTo(null);
      Keyboard.dismiss();
      await loadData({ silent: true });
    } catch (err) {
      showError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraftReply = async () => {
    setDraftingReply(true);
    try {
      const auth = await requireAuth();
      const payload = await draftForumReply({
        topicId,
        replyToId: replyingTo?.commentId ?? replyingTo?.id ?? null,
        userIntent: replyingTo ? '礼貌回复并补充建议' : '补充经验并给建议',
        userId: auth.userId,
        token: auth.token,
      });
      setCommentText(payload?.draft || '');
    } catch (err) {
      showError(errorMessage(err));
    } finally {
      setDraftingReply(false);
    }
  };

  const confirmDelete = (label, onConfirm) => {
    Alert.alert(`删除${label}`, `确定要删除这条${label}吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: onConfirm },
    ]);
  };

  const handleDeleteTopic = () => {
    confirmDelete('帖子', async () => {
      try {
        const auth = await requireAuth();
        await deleteForumTopic(topicId, auth);
        showError('已删除帖子');
      } catch (err) {
        showError(errorMessage(err));
      }
    });
  };

  const handleDeleteComment = (commentId) => {
    confirmDelete('评论', async () => {
      try {
        const auth = await requireAuth();
        await deleteForumComment(commentId, auth);
        await loadData({ silent: true });
      } catch (err) {
        showError(errorMessage(err));
      }
    });
  };

  const handleDeleteReply = (replyId) => {
    confirmDelete('回复', async () => {
      try {
        const auth = await requireAuth();
        await deleteForumReply(replyId, auth);
        await loadData({ silent: true });
      } catch (err) {
        showError(errorMessage(err));
      }
    });
  };

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
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={undefined}
        keyboardVerticalOffset={12}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        <View style={styles.topActions}>
          <Pressable style={styles.topBtn} onPress={() => Share.share({ message: `${topic?.title || ''}\n${topic?.content || ''}` })}>
            <Text style={styles.topBtnText}>↗</Text>
          </Pressable>
          <Pressable style={styles.topBtn} onPress={handleLike}>
            <Text style={[styles.topBtnText, isLiked ? styles.likedText : null]}>{isLiked ? '♥' : '♡'}</Text>
          </Pressable>
        </View>

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
          </View>
        )}

        <View style={styles.mainCard}>
          <View style={styles.authorRow}>
            {topic?.author?.avatar ? <Image source={{ uri: topic.author.avatar }} style={styles.avatar} /> : <View style={styles.avatar} />}
            <View style={styles.authorMeta}>
              <Text style={styles.authorName}>{topic?.author?.name || '匿名用户'}</Text>
              <Text style={styles.authorSub}>{topic?.category || '论坛'} · {summary}</Text>
            </View>
            {isOwnTopic ? (
              <Pressable style={styles.deleteBtn} onPress={handleDeleteTopic}>
                <Text style={styles.deleteBtnText}>删除</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.followBtn, isFollowingAuthor ? styles.followedBtn : null]} onPress={handleFollowAuthor}>
                <Text style={[styles.followBtnText, isFollowingAuthor ? styles.followedBtnText : null]}>{isFollowingAuthor ? '已关注' : '关注'}</Text>
              </Pressable>
            )}
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

        <View style={styles.aiKitCard}>
          <View style={styles.aiKitHeader}>
            <Text style={styles.aiKitTitle}>AI提炼用品清单</Text>
            <Text style={styles.aiKitSub}>基于帖子内容推荐</Text>
          </View>
          {aiKitLoading ? (
            <Text style={styles.aiKitText}>生成中...</Text>
          ) : aiKit.length === 0 ? (
            <Text style={styles.aiKitText}>暂无推荐，可直接去商城挑选。</Text>
          ) : (
            aiKit.slice(0, 3).map((item) => (
              <View key={`${item.productId}-${item.reason}`} style={styles.aiKitItem}>
                <Text style={styles.aiKitProduct}>{item.productId} x{item.quantity || 1}</Text>
                <Text style={styles.aiKitText}>{item.reason}</Text>
              </View>
            ))
          )}
          <Pressable
            style={styles.orderBtn}
            onPress={() => {
              const first = aiKit?.[0];
              const params = new URLSearchParams();
              if (first?.productId) params.set('productId', first.productId);
              if (first?.quantity) params.set('quantity', String(first.quantity));
              params.set('topicId', String(topicId));
              const orderPath = '/shop/order?' + params.toString();
              onOpenWeb?.(orderPath);
            }}
          >
            <Text style={styles.orderBtnText}>去下单</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatTime(topic?.createdAt)} · {authorFollowers} 人关注作者</Text>
          <Text style={styles.metaText}>不喜欢</Text>
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
              <View style={styles.commentTitleRow}>
                <Text style={styles.commentAuthor}>{comment?.author?.name || '匿名用户'}</Text>
                {currentUserId && comment?.author?.id === currentUserId ? (
                  <Pressable onPress={() => handleDeleteComment(comment.id)}><Text style={styles.commentAction}>删除</Text></Pressable>
                ) : null}
              </View>
              <Text style={styles.commentBody}>{comment?.content || ''}</Text>
              <View style={styles.commentActions}>
                <Pressable onPress={() => handleCommentLike(comment.id)}>
                  <Text style={[styles.commentStat, comment?.isLiked ? styles.statLiked : null]}>赞 {comment?.likes || 0}</Text>
                </Pressable>
                <Pressable onPress={() => focusComposer(comment)}>
                  <Text style={styles.commentStat}>回复 {(comment?.replies || []).length}</Text>
                </Pressable>
                <Text style={styles.commentStat}>{formatTime(comment?.createdAt)}</Text>
              </View>

              {(comment?.replies || []).map((reply) => (
                <View key={String(reply.id)} style={styles.replyCard}>
                  <View style={styles.commentTitleRow}>
                    <Text style={styles.replyAuthor}>{reply?.author?.name || '匿名用户'}</Text>
                    {currentUserId && reply?.author?.id === currentUserId ? (
                      <Pressable onPress={() => handleDeleteReply(reply.id)}><Text style={styles.commentAction}>删除</Text></Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.replyBody}>{reply.replyToUserName ? `回复 ${reply.replyToUserName}: ` : ''}{reply?.content || ''}</Text>
                  <View style={styles.commentActions}>
                    <Pressable onPress={() => handleReplyLike(reply.id)}>
                      <Text style={[styles.commentStat, reply?.isLiked ? styles.statLiked : null]}>赞 {reply?.likes || 0}</Text>
                    </Pressable>
                    <Pressable onPress={() => focusComposer({ ...comment, author: reply.author, commentId: comment.id })}>
                      <Text style={styles.commentStat}>回复</Text>
                    </Pressable>
                    <Text style={styles.commentStat}>{formatTime(reply?.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
        </ScrollView>

        <View style={[styles.keyboardComposer, { bottom: composerKeyboardLift }]}>
          {replyingTo ? (
            <View style={styles.replyingRow}>
              <Text style={styles.replyingText}>回复 {replyingTo?.author?.name || '用户'}</Text>
              <Pressable onPress={() => setReplyingTo(null)}><Text style={styles.cancelReply}>取消</Text></Pressable>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              ref={composerInputRef}
              value={commentText}
              onChangeText={setCommentText}
              onFocus={scrollCommentsIntoView}
              placeholder={replyingTo ? `回复 ${replyingTo?.author?.name || '用户'}...` : '让大家听到你的声音'}
              placeholderTextColor="#a08d80"
              style={[styles.commentInput, styles.composerInput]}
              multiline
            />
            <Pressable style={styles.draftBtn} onPress={handleDraftReply} disabled={draftingReply}>
              <Text style={styles.draftBtnText}>{draftingReply ? '生成中' : 'AI草拟'}</Text>
            </Pressable>
            <Pressable style={[styles.sendBtn, (!commentText.trim() || submitting) ? styles.sendBtnDisabled : null]} onPress={handleSubmitComment} disabled={!commentText.trim() || submitting}>
              <Text style={styles.sendBtnText}>{submitting ? '发送中' : '发送'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5ef' },
  keyboardAvoider: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  hintText: { color: '#8b6b4a' },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  errorActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  retryBtn: { borderRadius: 8, backgroundColor: '#ea7a1b', paddingHorizontal: 14, paddingVertical: 8 },
  retryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  copyBtn: { borderRadius: 8, backgroundColor: '#6b7280', paddingHorizontal: 14, paddingVertical: 8 },
  copyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  content: { paddingBottom: 128 },
  topActions: { position: 'absolute', top: 12, left: 14, right: 14, zIndex: 5, flexDirection: 'row', justifyContent: 'space-between' },
  topBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  topBtnText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  likedText: { color: '#fb7185' },
  heroWrap: { width: screenWidth, height: Math.round(screenWidth * 1.18), backgroundColor: '#0f0f0f', position: 'relative' },
  heroImage: { width: screenWidth, height: Math.round(screenWidth * 1.18), resizeMode: 'cover' },
  imageCounter: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  imageCounterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mainCard: { marginTop: -10, marginHorizontal: 12, borderRadius: 8, backgroundColor: '#fffdf9', borderWidth: 1, borderColor: '#f4e6d5', padding: 14, gap: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e8ddd0' },
  authorMeta: { flex: 1, marginLeft: 10, gap: 2 },
  authorName: { color: '#1b120e', fontSize: 14, fontWeight: '700' },
  authorSub: { color: '#8b6b4a', fontSize: 12 },
  followBtn: { borderRadius: 99, backgroundColor: '#ea7a1b', paddingHorizontal: 12, paddingVertical: 6 },
  followedBtn: { backgroundColor: '#e7e1da' },
  followBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  followedBtnText: { color: '#4d4038' },
  deleteBtn: { borderRadius: 99, backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: '#b91c1c', fontSize: 12, fontWeight: '800' },
  title: { color: '#1b120e', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  body: { color: '#3d2b1f', fontSize: 15, lineHeight: 23 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { borderRadius: 8, backgroundColor: '#fff2df', borderWidth: 1, borderColor: '#f6d7ac', paddingHorizontal: 8, paddingVertical: 5 },
  tagText: { color: '#bf6b1e', fontSize: 12, fontWeight: '600' },
  aiKitCard: { margin: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f1dfc5', backgroundColor: '#fff9ef', padding: 12, gap: 8 },
  aiKitHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  aiKitTitle: { color: '#7a4f1d', fontSize: 14, fontWeight: '900' },
  aiKitSub: { color: '#a36b2a', fontSize: 11, fontWeight: '600' },
  aiKitItem: { borderRadius: 8, borderWidth: 1, borderColor: '#f5e7d4', backgroundColor: '#fff', padding: 9, gap: 4 },
  aiKitProduct: { color: '#5d3b1a', fontSize: 12, fontWeight: '900' },
  aiKitText: { color: '#7a5a3d', fontSize: 12, lineHeight: 17 },
  orderBtn: { marginTop: 2, borderRadius: 8, backgroundColor: '#e67e22', height: 40, alignItems: 'center', justifyContent: 'center' },
  orderBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  metaRow: { marginHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eadfd4', flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { color: '#83746b', fontSize: 12, fontWeight: '600' },
  commentHeader: { marginTop: 4, marginBottom: 6, marginHorizontal: 14 },
  commentHeaderText: { color: '#1b120e', fontSize: 16, fontWeight: '800' },
  inputCard: { marginHorizontal: 12, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eadfd4', backgroundColor: '#fffdf9', padding: 10, gap: 8 },
  keyboardComposer: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#eadfd4', backgroundColor: '#fffdf9', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 10 : 8, gap: 8 },
  replyingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  replyingText: { color: '#7b6252', fontSize: 12, fontWeight: '700' },
  cancelReply: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  commentInput: { flex: 1, minHeight: 38, borderRadius: 8, backgroundColor: '#f2ede7', paddingHorizontal: 10, color: '#241914', fontSize: 13 },
  composerInput: { maxHeight: 90, paddingVertical: 9, textAlignVertical: 'top' },
  draftBtn: { borderRadius: 8, backgroundColor: '#fff2df', paddingHorizontal: 9, paddingVertical: 10 },
  draftBtnText: { color: '#c15f12', fontSize: 12, fontWeight: '900' },
  sendBtn: { borderRadius: 8, backgroundColor: '#0f766e', paddingHorizontal: 10, paddingVertical: 10 },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  emptyCard: { marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#f4e6d5', backgroundColor: '#fffdf9', padding: 14 },
  emptyText: { color: '#8b6b4a' },
  commentCard: { marginHorizontal: 12, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#f4e6d5', backgroundColor: '#fffdf9', padding: 12, gap: 6 },
  commentTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentAuthor: { color: '#1b120e', fontSize: 13, fontWeight: '700' },
  commentAction: { color: '#b91c1c', fontSize: 11, fontWeight: '800' },
  commentBody: { color: '#3d2b1f', fontSize: 14, lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  commentStat: { color: '#8b6b4a', fontSize: 12, fontWeight: '700' },
  statLiked: { color: '#e11d48' },
  replyCard: { marginTop: 2, borderRadius: 8, borderWidth: 1, borderColor: '#f2e9dd', backgroundColor: '#fff8ef', padding: 10, gap: 4 },
  replyAuthor: { color: '#5f4430', fontSize: 12, fontWeight: '700' },
  replyBody: { color: '#6a4a35', fontSize: 13, lineHeight: 18 },
});
