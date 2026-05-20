import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import PetDetailsScreen from './src/screens/PetDetailsScreen';
import { appScheme, extractPetIdFromUrl } from './src/navigation/linking';

const DEFAULT_PET_ID = '1';

export default function App() {
  const [currentPetId, setCurrentPetId] = useState(DEFAULT_PET_ID);

  useEffect(() => {
    let mounted = true;

    async function bootstrapFromInitialUrl() {
      const initialUrl = await Linking.getInitialURL();
      const petId = extractPetIdFromUrl(initialUrl);
      if (mounted && petId) {
        setCurrentPetId(petId);
      }
    }

    bootstrapFromInitialUrl();

    const sub = Linking.addEventListener('url', ({ url }) => {
      const petId = extractPetIdFromUrl(url);
      if (petId) {
        setCurrentPetId(petId);
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const tipText = useMemo(() => {
    return `当前试点宠物ID: ${currentPetId}（Deep Link: ${appScheme}://pet/${currentPetId}）`;
  }, [currentPetId]);

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Dog Project RN Pilot (Expo)</Text>
        <Text style={styles.bannerDesc}>{tipText}</Text>
      </View>
      <PetDetailsScreen petId={currentPetId} onBack={() => {}} />
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
