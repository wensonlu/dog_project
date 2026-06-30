import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import ForumDetailScreen from './src/screens/ForumDetailScreen';
import ForumListScreen from './src/screens/ForumListScreen';
import ContentHubScreen from './src/screens/ContentHubScreen';
import StoriesScreen from './src/screens/StoriesScreen';
import StoryDetailScreen from './src/screens/StoryDetailScreen';
import RnDemoScreen from './src/screens/RnDemoScreen';
import RnPageShell from './src/components/RnPageShell';
import { appScheme, buildWebUrl, parseLaunchPayload } from './src/navigation/linking';
import { saveAuthState } from './src/services/auth';
import { exchangeMobileTicket } from './src/services/api';
import DebugConsolePanel from './src/debug/DebugConsolePanel';
import { addConsoleLog } from './src/debug/debugStore';

const DEFAULT_ROUTE = { type: 'demo' };

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
  const persistAuthFromPayload = useCallback(async (payload) => {
    if (payload?.ticket) {
      try {
        const ticketSession = await exchangeMobileTicket(payload.ticket);
        await saveAuthState({
          token: ticketSession?.token,
          userId: ticketSession?.userId,
        });
        return;
      } catch (_err) {
        // Fall through to direct token/userId params if they were provided.
      }
    }

    if (payload?.token || payload?.userId) {
      await saveAuthState({ token: payload.token, userId: payload.userId });
    }
  }, []);
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
    } else if (payload?.routeType === 'forum' && !payload?.topicId) {
      setRoute({ type: 'forum-list', ...routeMeta });
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
  const openRnRoute = useCallback(async (url, options) => {
    const payload = parseLaunchPayload(url);
    console.log('[RN Route] launchUrl:', url || '');
    console.log('[RN Route] payload:', payload);
    await persistAuthFromPayload(payload);
    applyRoutePayload(url, payload, options);
  }, [applyRoutePayload, persistAuthFromPayload]);
  const backFromPreviewOrClose = () => {
    if (route.returnTo === 'demo') {
      setRoute({ type: 'demo' });
      return;
    }
    handleBack();
  };
  const handleRouteBack = () => {
    if (route.type === 'stories') {
      setRoute({ type: 'content' });
      return;
    }
    if (route.type === 'story') {
      setRoute(previousStoryRoute);
      return;
    }
    backFromPreviewOrClose();
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
      await persistAuthFromPayload(payload);
      if (mounted) {
        applyRoutePayload(url, payload);
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
  }, [applyRoutePayload, persistAuthFromPayload, props?.launchUrl, props?.debugParams]);

  const pageChrome = useMemo(() => {
    if (route.type === 'demo') {
      return { title: 'RN Demo', subtitle: '容器与调试入口' };
    }
    if (route.type === 'content') {
      return { title: '内容中心', subtitle: '百科知识与领养故事' };
    }
    if (route.type === 'stories') {
      return { title: '幸福故事', subtitle: '每一个领养都是爱的延续' };
    }
    if (route.type === 'story') {
      return { title: '故事详情', subtitle: `Deep Link: ${appScheme}://story/${route.id}` };
    }
    if (route.type === 'forum-list') {
      return { title: '论坛列表', subtitle: `Deep Link: ${appScheme}://forum` };
    }
    if (route.type === 'forum') {
      return { title: '论坛详情', subtitle: `Deep Link: ${appScheme}://forum/${route.id}` };
    }
    return { title: '宠物详情', subtitle: `Deep Link: ${appScheme}://pet/${route.id}` };
  }, [route]);

  const screen = route.type === 'demo' ? (
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
      onOpenStory={(storyId) => openStory(storyId, { type: 'stories' })}
      onOpenWeb={openWeb}
    />
  ) : route.type === 'story' ? (
    <StoryDetailScreen
      storyId={route.id}
      onOpenWeb={openWeb}
    />
  ) : route.type === 'forum-list' ? (
    <ForumListScreen
      onOpenTopic={(topicId) => setRoute({ type: 'forum', id: String(topicId) })}
      onOpenWeb={openWeb}
    />
  ) : route.type === 'forum' ? (
    <ForumDetailScreen topicId={route.id} onOpenWeb={openWeb} />
  ) : (
    <PetDetailsScreen
      petId={route.id}
      onOpenForumTopic={(topic) => {
        const topicId = topic?.id ? String(topic.id) : null;
        if (!topicId) return;
        setRoute({ type: 'forum', id: topicId });
      }}
    />
  );

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" />
      <RnPageShell
        title={pageChrome.title}
        subtitle={pageChrome.subtitle}
        onBack={handleRouteBack}
      >
        {screen}
      </RnPageShell>
      <DebugConsolePanel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
});
