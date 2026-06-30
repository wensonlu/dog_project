import { Pressable, StyleSheet, Text, View } from 'react-native';

const items = [
  { key: 'home', label: '探索', path: '/' },
  { key: 'forum', label: '论坛', path: '/forum' },
  { key: 'shop', label: '商城', path: '/shop' },
  { key: 'stories', label: '故事', path: '/content' },
  { key: 'profile', label: '我的', path: '/profile' },
];

export default function HybridBottomNav({ activeKey = 'stories', onOpenWeb, onOpenStoriesHome }) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.label}
            style={styles.item}
            disabled={active}
            onPress={() => {
              if (item.key === 'stories' && typeof onOpenStoriesHome === 'function') {
                onOpenStoriesHome();
                return;
              }
              onOpenWeb(item.path);
            }}
          >
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#ede7de',
    backgroundColor: '#fffdf9',
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#d0bb95' },
  dotActive: { width: 18, backgroundColor: '#e56d63' },
  label: { color: '#9b846c', fontSize: 11, fontWeight: '700' },
  labelActive: { color: '#e56d63' },
});
