import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { clearLogs, exportLogsText, subscribeDebugStore } from './debugStore';

export default function DebugConsolePanel() {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState('console');
  const [logs, setLogs] = useState({ consoleLogs: [], networkLogs: [] });

  useEffect(() => subscribeDebugStore(setLogs), []);

  const currentLogs = useMemo(() => {
    if (tab === 'console') return logs.consoleLogs;
    return logs.networkLogs;
  }, [tab, logs]);

  const exportLogs = async () => {
    const content = exportLogsText();
    await Share.share({
      message: content,
      title: 'RN Debug Logs',
    });
  };

  return (
    <>
      <Pressable style={styles.fab} onPress={() => setVisible(true)}>
        <Text style={styles.fabText}>调试</Text>
      </Pressable>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text style={styles.title}>RN 调试控制台</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.close}>关闭</Text>
              </Pressable>
            </View>

            <View style={styles.tabRow}>
              <Pressable style={[styles.tab, tab === 'console' && styles.tabActive]} onPress={() => setTab('console')}>
                <Text style={[styles.tabText, tab === 'console' && styles.tabTextActive]}>Console</Text>
              </Pressable>
              <Pressable style={[styles.tab, tab === 'network' && styles.tabActive]} onPress={() => setTab('network')}>
                <Text style={[styles.tabText, tab === 'network' && styles.tabTextActive]}>Network</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.logBox} contentContainerStyle={{ paddingBottom: 24 }}>
              {currentLogs.length === 0 ? (
                <Text style={styles.empty}>暂无日志</Text>
              ) : (
                currentLogs.slice().reverse().map((item, idx) => (
                  <View key={`${item.ts}-${idx}`} style={styles.logItem}>
                    <Text style={styles.logTs}>{item.ts}</Text>
                    <Text style={styles.logMsg}>{typeof item.message === 'string' ? item.message : JSON.stringify(item)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable style={styles.btn} onPress={clearLogs}>
                <Text style={styles.btnText}>清空</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={exportLogs}>
                <Text style={[styles.btnText, styles.btnTextPrimary]}>导出日志</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 14,
    bottom: 26,
    zIndex: 999,
    backgroundColor: '#7c2d12',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  panel: {
    height: '72%',
    backgroundColor: '#fff7ed',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#7c2d12' },
  close: { fontSize: 14, color: '#9a3412' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#fff' },
  tabActive: { backgroundColor: '#ea580c' },
  tabText: { fontSize: 12, color: '#7c2d12', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  logBox: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 8 },
  empty: { color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 20 },
  logItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6 },
  logTs: { fontSize: 10, color: '#94a3b8' },
  logMsg: { fontSize: 12, color: '#111827', marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingVertical: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff' },
  btnPrimary: { backgroundColor: '#ea580c' },
  btnText: { fontSize: 12, color: '#7c2d12', fontWeight: '700' },
  btnTextPrimary: { color: '#fff' },
});
