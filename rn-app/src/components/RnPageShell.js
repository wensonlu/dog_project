import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function RnPageShell({
  title,
  subtitle,
  children,
  onBack,
}) {
  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={10}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1e5d8',
    backgroundColor: '#fffdf9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff4e8',
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  backIcon: {
    marginTop: -2,
    color: '#3b2a22',
    fontSize: 32,
    fontWeight: '500',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    color: '#241914',
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 2,
    color: '#8c7969',
    fontSize: 11,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  body: {
    flex: 1,
  },
});
