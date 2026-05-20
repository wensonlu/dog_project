import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchPetDetails, togglePetFavorite } from '../services/api';
import { getAuthToken } from '../services/auth';

export default function PetDetailsScreen({ petId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pet, setPet] = useState(null);
  const [token, setToken] = useState(null);
  const [favoriting, setFavoriting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPetData() {
      setLoading(true);
      setError('');
      try {
        const authToken = await getAuthToken();
        if (!cancelled) setToken(authToken);

        const payload = await fetchPetDetails(petId, authToken);
        if (!cancelled) {
          const normalizedPet = payload?.dog || payload?.data || payload;
          setPet(normalizedPet || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '加载失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPetData();
    return () => {
      cancelled = true;
    };
  }, [petId]);

  const title = useMemo(() => {
    if (!pet) return `宠物 #${petId}`;
    return `${pet.name || '未命名宠物'}${pet.age ? `, ${pet.age}` : ''}`;
  }, [pet, petId]);

  const handleFavorite = async () => {
    try {
      setFavoriting(true);
      await togglePetFavorite(petId, token);
      Alert.alert('收藏成功', '已加入你的收藏列表');
    } catch (err) {
      if (String(err.message || '') === 'NOT_AUTHENTICATED') {
        Alert.alert('请先登录', '当前为试点版本，请先完成登录态打通。');
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
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
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

          <View style={styles.card}>
            <Text style={styles.cardTitle}>关于我</Text>
            <Text style={styles.cardText}>
              这是 Expo 试点页面骨架。下一步会对齐 Web 端详情页的数据字段、相关讨论与评价模块。
            </Text>
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
  content: {
    padding: 16,
    gap: 12,
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
});
