import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import ForumDetailScreen from './src/screens/ForumDetailScreen';
import { appScheme, parseLaunchPayload } from './src/navigation/linking';
import { saveAuthState } from './src/services/auth';

const DEFAULT_ROUTE = { type: 'pet', id: '1' };

export default function App() {
  const [route, setRoute] = useState(DEFAULT_ROUTE);

  useEffect(() => {
    let mounted = true;

    async function applyLaunchUrl(url) {
      const payload = parseLaunchPayload(url);

      if (payload?.topicId && mounted) {
        setRoute({ type: 'forum', id: payload.topicId });
      } else if (payload?.petId && mounted) {
        setRoute({ type: 'pet', id: payload.petId });
      }

      if (payload?.token || payload?.userId) {
        await saveAuthState({ token: payload.token, userId: payload.userId });
      }
    }

    async function bootstrapFromInitialUrl() {
      const initialUrl = await Linking.getInitialURL();
      await applyLaunchUrl(initialUrl);
    }

    bootstrapFromInitialUrl();

    const sub = Linking.addEventListener('url', ({ url }) => {
      applyLaunchUrl(url);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const tipText = useMemo(() => {
    if (route.type === 'forum') {
      return `当前试点帖子ID: ${route.id}（Deep Link: ${appScheme}://forum/${route.id}）`;
    }
    return `当前试点宠物ID: ${route.id}（Deep Link: ${appScheme}://pet/${route.id}）`;
  }, [route]);

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Dog Project RN Pilot (Expo)</Text>
        <Text style={styles.bannerDesc}>{tipText}</Text>
      </View>
      {route.type === 'forum' ? (
        <ForumDetailScreen topicId={route.id} />
      ) : (
        <PetDetailsScreen petId={route.id} onBack={() => {}} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    backgroundColor: '#ffedd5',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7c2d12',
  },
  bannerDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#9a3412',
  },
});
