import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';

export default function OfflineScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const retry = () => { setLoading(true); setTimeout(() => setLoading(false), 700); };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}><Text style={{ color: theme.primaryBright, fontSize: 28 }}>Offline</Text></View>
        <Text style={[styles.title, { color: theme.text }]}>Vous êtes hors connexion</Text>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', lineHeight: 22 }}>Certaines ressources nécessitent une connexion Internet.</Text>
        <View style={styles.actions}><AppButton label="Réessayer" loading={loading} onPress={retry} /><AppButton label="Retour" variant="secondary" onPress={() => router.back()} /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { flex: 1, maxWidth: 460, width: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { height: 90, width: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, title: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  actions: { width: '100%', gap: 10, marginTop: 24 },
});
