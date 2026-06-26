import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import ForumDetailScreen from './src/screens/ForumDetailScreen';
import ContentHubScreen from './src/screens/ContentHubScreen';
import StoriesScreen from './src/screens/StoriesScreen';
import StoryDetailScreen from './src/screens/StoryDetailScreen';
import RnDemoScreen from './src/screens/RnDemoScreen';
import { appScheme, buildWebUrl, parseLaunchPayload } from './src/navigation/linking';
import { saveAuthState } from './src/services/auth';
import { exchangeMobileTicket } from './src/services/api';
import DebugConsolePanel from './src/debug/DebugConsolePanel';
import { addConsoleLog } from './src/debug/debugStore';

const DEFAULT_ROUTE = { type: 'pet', id: '1' };

export default function App(props) {
  const [route, setRoute] = useState(DEFAULT_ROUTE);
  const [launchContext, setLaunchContext] = useState(() => ({
    launchUrl: props?.launchUrl || '',
    bundleSource: props?.bundleSource || 'unknown',
    debugParams: props?.debugParams || {},
  }));
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
  const applyRoutePayload = useCallback((url, payload, options = {}) => {
    const routeMeta = options.returnTo ? { returnTo: options.returnTo } : {};

    setLaunchContext((prev) => ({
      ...prev,
      launchUrl: url || prev.launchUrl,
      debugParams: payload?.debugParams || props?.debugParams || prev.debugParams || {},
    }));

    if (payload?.routeType === 'rn-demo') {
      setRoute({ type: 'demo' });
    } else if (payload?.routeType === 'content') {
      setRoute({ type: 'content', ...routeMeta });
    } else if (payload?.routeType === 'stories') {
      setRoute({ type: 'stories', ...routeMeta });
    } else if (payload?.storyId) {
      setPreviousStoryRoute(options.returnTo === 'demo' ? { type: 'demo' } : { type: 'stories' });
      setRoute({ type: 'story', id: payload.storyId, ...routeMeta });
    } else if (payload?.topicId) {
      console.log('[RN Route] switch -> forum', payload.topicId);
      setRoute({ type: 'forum', id: payload.topicId, ...routeMeta });
    } else if (payload?.petId) {
      console.log('[RN Route] switch -> pet', payload.petId);
      setRoute({ type: 'pet', id: payload.petId, ...routeMeta });
    } else {
      console.log('[RN Route] no topicId/petId, keep default route');
    }
  }, [props?.debugParams]);
  const openRnRoute = useCallback((url, options) => {
    const payload = parseLaunchPayload(url);
    console.log('[RN Route] launchUrl:', url || '');
    console.log('[RN Route] payload:', payload);
    applyRoutePayload(url, payload, options);
  }, [applyRoutePayload]);
  const backFromPreviewOrClose = () => {
    if (route.returnTo === 'demo') {
      setRoute({ type: 'demo' });
      return;
    }
    handleBack();
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
      if (mounted) {
        applyRoutePayload(url, payload);
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
  }, [applyRoutePayload, props?.launchUrl, props?.debugParams]);

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
      {route.type === 'demo' ? (
        <RnDemoScreen
          launchUrl={launchContext.launchUrl}
          bundleSource={launchContext.bundleSource}
          debugParams={launchContext.debugParams}
          onOpenRoute={(url) => openRnRoute(url, { returnTo: 'demo' })}
        />
      ) : route.type === 'content' ? (
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
        <ForumDetailScreen topicId={route.id} onBack={backFromPreviewOrClose} />
      ) : (
        <PetDetailsScreen
          petId={route.id}
          onBack={backFromPreviewOrClose}
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
