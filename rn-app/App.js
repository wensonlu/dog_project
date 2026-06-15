import { useEffect, useMemo, useState } from 'react';
import { Linking, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import ForumDetailScreen from './src/screens/ForumDetailScreen';
import ContentHubScreen from './src/screens/ContentHubScreen';
import StoriesScreen from './src/screens/StoriesScreen';
import StoryDetailScreen from './src/screens/StoryDetailScreen';
import { appScheme, buildWebUrl, parseLaunchPayload } from './src/navigation/linking';
import { saveAuthState } from './src/services/auth';
import { exchangeMobileTicket } from './src/services/api';
import DebugConsolePanel from './src/debug/DebugConsolePanel';
import { addConsoleLog } from './src/debug/debugStore';

const DEFAULT_ROUTE = { type: 'pet', id: '1' };

export default function App(props) {
  const [route, setRoute] = useState(DEFAULT_ROUTE);
  const [previousStoryRoute, setPreviousStoryRoute] = useState({ type: 'content' });
  const handleBack = async () => {
    try {
      await Linking.openURL(`${appScheme}://close`);
    } catch (_err) {
      setRoute(DEFAULT_ROUTE);
    }
  };
  const openWeb = async (path) => {
    await Linking.openURL(buildWebUrl(path));
  };
  const openStory = (storyId, from = route) => {
    setPreviousStoryRoute(from?.type === 'stories' ? { type: 'stories' } : { type: 'content' });
    setRoute({ type: 'story', id: String(storyId) });
  };

  useEffect(() => {
    const levels = ['log', 'info', 'warn', 'error'];
    const originals = {};
    levels.forEach((level) => {
      originals[level] = console[level]?.bind(console);
      console[level] = (...args) => {
        try {
          addConsoleLog(level, args.map((item) => {
            try {
              return typeof item === 'string' ? item : JSON.stringify(item);
            } catch {
              return String(item);
            }
          }).join(' '));
        } catch {
          // noop
        }
        originals[level]?.(...args);
      };
    });

    return () => {
      levels.forEach((level) => {
        if (originals[level]) console[level] = originals[level];
      });
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function applyLaunchUrl(url) {
      const payload = parseLaunchPayload(url);
      console.log('[RN Route] launchUrl:', url || '');
      console.log('[RN Route] payload:', payload);

      if (payload?.routeType === 'content' && mounted) {
        setRoute({ type: 'content' });
      } else if (payload?.routeType === 'stories' && mounted) {
        setRoute({ type: 'stories' });
      } else if (payload?.storyId && mounted) {
        setPreviousStoryRoute({ type: 'stories' });
        setRoute({ type: 'story', id: payload.storyId });
      } else if (payload?.topicId && mounted) {
        console.log('[RN Route] switch -> forum', payload.topicId);
        setRoute({ type: 'forum', id: payload.topicId });
      } else if (payload?.petId && mounted) {
        console.log('[RN Route] switch -> pet', payload.petId);
        setRoute({ type: 'pet', id: payload.petId });
      } else {
        console.log('[RN Route] no topicId/petId, keep default route');
      }

      if (payload?.token || payload?.userId) {
        await saveAuthState({ token: payload.token, userId: payload.userId });
      }

      if (payload?.ticket) {
        try {
          const ticketSession = await exchangeMobileTicket(payload.ticket);
          await saveAuthState({
            token: ticketSession?.token,
            userId: ticketSession?.userId,
          });
        } catch (_err) {
          // Ticket exchange failure should not block page routing.
        }
      }
    }

    async function bootstrapFromInitialUrl() {
      const initialUrl = props?.launchUrl || (await Linking.getInitialURL());
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
      <StatusBar barStyle="dark-content" />
      {['pet', 'forum'].includes(route.type) ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Dog Project RN Pilot (Expo)</Text>
          <Text style={styles.bannerDesc}>{tipText}</Text>
        </View>
      ) : null}
      {route.type === 'content' ? (
        <ContentHubScreen
          onOpenStories={() => setRoute({ type: 'stories' })}
          onOpenStory={(storyId) => openStory(storyId, { type: 'content' })}
          onOpenWeb={openWeb}
        />
      ) : route.type === 'stories' ? (
        <StoriesScreen
          onBack={() => setRoute({ type: 'content' })}
          onOpenStory={(storyId) => openStory(storyId, { type: 'stories' })}
          onOpenWeb={openWeb}
        />
      ) : route.type === 'story' ? (
        <StoryDetailScreen
          storyId={route.id}
          onBack={() => setRoute(previousStoryRoute)}
          onOpenWeb={openWeb}
        />
      ) : route.type === 'forum' ? (
        <ForumDetailScreen topicId={route.id} onBack={handleBack} />
      ) : (
        <PetDetailsScreen
          petId={route.id}
          onBack={handleBack}
          onOpenForumTopic={(topic) => {
            const topicId = topic?.id ? String(topic.id) : null;
            if (!topicId) return;
            setRoute({ type: 'forum', id: topicId });
          }}
        />
      )}
      <DebugConsolePanel />
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
