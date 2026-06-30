import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import rnDemoEntries from '../navigation/rnDemoEntries.json';

function KeyValueRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '-'}</Text>
    </View>
  );
}

export default function RnDemoScreen({ launchUrl, bundleSource, debugParams, onOpenRoute }) {
  const debugText = debugParams && Object.keys(debugParams).length > 0
    ? JSON.stringify(debugParams, null, 2)
    : 'No debug params injected';

  const handleOpenEntry = async (entry) => {
    try {
      if (typeof onOpenRoute === 'function') {
        await onOpenRoute(entry.launchUrl);
        return;
      }
      await Linking.openURL(entry.launchUrl);
    } catch (err) {
      Alert.alert('页面打开失败', err?.message || entry.launchUrl);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Dog Project</Text>
        <Text style={styles.title}>RN Demo Tab</Text>
        <Text style={styles.subtitle}>
          This screen is rendered by React Native inside the main iOS app.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Host Context</Text>
        <KeyValueRow label="Route" value="dogproject://rn-demo" />
        <KeyValueRow label="Bundle" value={bundleSource} />
        <KeyValueRow label="Launch URL" value={launchUrl} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>RN Pages</Text>
        <View style={styles.entryList}>
          {rnDemoEntries.map((entry) => (
            <Pressable
              key={entry.key}
              style={({ pressed }) => [
                styles.entryCard,
                launchUrl === entry.launchUrl ? styles.entryCardActive : null,
                pressed ? styles.entryCardPressed : null,
              ]}
              onPress={() => handleOpenEntry(entry)}
            >
              <View style={styles.entryContent}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text style={styles.entryRoute}>{entry.routeType}</Text>
                </View>
                <Text style={styles.entryScreen}>{entry.screen}</Text>
                <Text style={styles.entryDescription}>{entry.description}</Text>
                <Text numberOfLines={1} style={styles.entryUrl}>{entry.launchUrl}</Text>
              </View>
              <Text style={styles.entryArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Debug Params</Text>
        <Text style={styles.code}>{debugText}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Development Flow</Text>
        <Text style={styles.body}>
          Build a new JS bundle, scan its QR code in the main app, and this RN
          container will reload from the sandbox bundle without rebuilding iOS.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  hero: {
    paddingVertical: 24,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 8,
    color: '#18181b',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    color: '#57534e',
    fontSize: 16,
    lineHeight: 23,
  },
  panel: {
    marginTop: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#ffffff',
    padding: 16,
  },
  panelTitle: {
    color: '#7c2d12',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  entryList: {
    gap: 10,
  },
  entryCard: {
    minHeight: 94,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryCardActive: {
    borderColor: '#0f766e',
    backgroundColor: '#ecfdf5',
  },
  entryCardPressed: {
    opacity: 0.82,
  },
  entryContent: {
    flex: 1,
    minWidth: 0,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTitle: {
    flex: 1,
    color: '#18181b',
    fontSize: 15,
    fontWeight: '800',
  },
  entryRoute: {
    borderRadius: 8,
    backgroundColor: '#ccfbf1',
    color: '#115e59',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 7,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  entryScreen: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  entryDescription: {
    marginTop: 6,
    color: '#44403c',
    fontSize: 13,
    lineHeight: 18,
  },
  entryUrl: {
    marginTop: 6,
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
  },
  entryArrow: {
    marginLeft: 10,
    color: '#0f766e',
    fontSize: 28,
    fontWeight: '400',
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: '#ffedd5',
    paddingVertical: 10,
  },
  rowLabel: {
    color: '#a16207',
    fontSize: 12,
    fontWeight: '700',
  },
  rowValue: {
    marginTop: 4,
    color: '#292524',
    fontSize: 13,
    lineHeight: 19,
  },
  code: {
    borderRadius: 8,
    backgroundColor: '#1c1917',
    color: '#fef3c7',
    fontSize: 12,
    lineHeight: 18,
    padding: 12,
  },
  body: {
    color: '#44403c',
    fontSize: 14,
    lineHeight: 22,
  },
});
