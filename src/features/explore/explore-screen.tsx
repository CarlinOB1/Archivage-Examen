import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Search } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/states';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

export default function ExploreScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const params = useLocalSearchParams<{ subject?: string }>();
  const store = useAppStore();
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(params.subject ? String(params.subject) : 'Toutes');
  const [levelFilter, setLevelFilter] = useState('Tous');
  const results = useMemo(() => store.documents.filter((doc) => {
    const subjectOk = subjectFilter === 'Toutes' || doc.subjectName === subjectFilter;
    const levelOk = levelFilter === 'Tous' || doc.level === levelFilter;
    const queryOk = !query || `${doc.title} ${doc.subjectName}`.toLowerCase().includes(query.toLowerCase());
    return subjectOk && levelOk && queryOk;
  }), [store.documents, subjectFilter, levelFilter, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[
        styles.container,
        {
          maxWidth: responsive.contentMaxWidth,
          paddingHorizontal: responsive.horizontalPadding,
          paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
        },
      ]}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher une ressource" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.text }]} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Matières</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['Toutes', ...store.subjects.map((subject) => subject.name)].map((subject) => (
            <Pressable key={subject} onPress={() => setSubjectFilter(subject)} style={[styles.chip, { borderColor: theme.border, backgroundColor: subjectFilter === subject ? theme.primary : theme.backgroundElement }]}>
              <Text style={{ color: subjectFilter === subject ? '#fff' : theme.text, fontWeight: '700', fontSize: 13 }}>{subject}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Niveau</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['Tous', 'Licence 1', 'Licence 2', 'Licence 3'].map((level) => (
            <Pressable key={level} onPress={() => setLevelFilter(level)} style={[styles.chip, { borderColor: theme.border, backgroundColor: levelFilter === level ? theme.primary : theme.backgroundElement }]}>
              <Text style={{ color: levelFilter === level ? '#fff' : theme.text, fontWeight: '700', fontSize: 13 }}>{level}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.resultHeader}><Text style={[styles.sectionTitle, { color: theme.text }]}>Résultats</Text><Text style={{ color: theme.textSecondary }}>{results.length} document(s)</Text></View>
        {results.length ? results.map((document) => (
          <Pressable key={document.id} onPress={() => router.push(`/documents/${document.id}`)} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: theme.text }]}>{document.title}</Text><Text style={{ color: theme.textSecondary, marginTop: 4 }}>{document.subjectName} · {document.level} · {document.academicYear}</Text></View>
            <ChevronRight color={theme.textSecondary} size={20} />
          </Pressable>
        )) : <EmptyState title="Aucun résultat" description="Modifiez les mots-clés ou réinitialisez les filtres." actionLabel="Réinitialiser" onAction={() => { setQuery(''); setSubjectFilter('Toutes'); setLevelFilter('Tous'); }} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16, paddingBottom: BottomTabInset + 24 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 16 },
  search: { height: 52, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  input: { flex: 1, height: '100%', paddingHorizontal: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 18 },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { height: 38, borderRadius: 19, borderWidth: 1, paddingHorizontal: 14, justifyContent: 'center' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { marginTop: 10, borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
});
