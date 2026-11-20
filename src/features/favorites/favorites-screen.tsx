import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function FavoritesScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: responsive.contentMaxWidth, paddingHorizontal: responsive.horizontalPadding, paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Favoris</Text>
        {store.favorites.length ? store.favorites.map((doc) => (
          <Pressable key={doc.id} onPress={() => router.push(`/documents/${doc.id}`)} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}><Bookmark size={22} color={theme.primaryBright} /></View>
            <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: theme.text }]}>{doc.title}</Text><Text style={{ color: theme.textSecondary, marginTop: 4 }}>{doc.subjectName} · {doc.level} · {doc.academicYear}</Text></View>
            <Pressable accessibilityLabel="Retirer des favoris" onPress={() => { void store.toggleFavorite(doc.id).catch(() => undefined); }} style={styles.remove}><Text style={{ color: '#B42318', fontSize: 12, fontWeight: '700' }}>Retirer</Text></Pressable>
          </Pressable>
        )) : <EmptyState title="Aucun favori" description="Vous n’avez pas encore ajouté de documents à vos favoris." actionLabel="Découvrir les ressources" onAction={() => router.push('/(tabs)/explore')} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 16 }, card: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 15, fontWeight: '800' }, remove: { padding: 8 },
});
