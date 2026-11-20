import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/states';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function SearchScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const params = useLocalSearchParams<{ query?: string }>();
  const store = useAppStore();
  const [query, setQuery] = useState(typeof params.query === 'string' ? params.query : '');
  const results = useMemo(() => query.trim() ? store.documents.filter((doc) => `${doc.title} ${doc.subjectName} ${doc.contributorName}`.toLowerCase().includes(query.trim().toLowerCase())) : [], [query, store.documents]);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Retour</Text></Pressable><Text style={[styles.title, { color: theme.text }]}>Recherche</Text></View>
      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border, marginHorizontal: responsive.horizontalPadding }]}><Search size={20} color={theme.textSecondary} /><TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Matière, titre ou auteur" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.text }]} />{query ? <Pressable accessibilityLabel="Effacer la recherche" onPress={() => setQuery('')}><X size={20} color={theme.textSecondary} /></Pressable> : null}</View>
      <ScrollView contentContainerStyle={styles.results}>
        {!query ? <EmptyState title="Que souhaitez-vous trouver ?" description="Saisissez un mot-clé pour rechercher une ressource." /> : results.length ? results.map((doc) => (
          <Pressable key={doc.id} onPress={() => router.push(`/documents/${doc.id}`)} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><Text style={[styles.cardTitle, { color: theme.text }]}>{doc.title}</Text><Text style={{ color: theme.textSecondary, marginTop: 4 }}>{doc.subjectName} · {doc.level} · {doc.academicYear}</Text></Pressable>
        )) : <EmptyState title="Aucun résultat" description={`Aucune ressource ne correspond à « ${query} ».`} actionLabel="Effacer" onAction={() => setQuery('')} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { paddingHorizontal: 20, paddingTop: 12 }, title: { fontSize: 28, fontWeight: '800', marginTop: 10 },
  search: { margin: 20, height: 52, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  input: { flex: 1, height: '100%', paddingHorizontal: 10 }, results: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10 }, cardTitle: { fontSize: 16, fontWeight: '800' },
});
