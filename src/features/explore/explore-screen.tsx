import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function ExploreScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const params = useLocalSearchParams<{ subject?: string }>();
  const store = useAppStore();

  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState(params.subject ? String(params.subject) : 'Toutes');
  const [levelFilter, setLevelFilter] = useState('Tous');
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await store.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [store]);

  const results = useMemo(() => store.documents.filter((doc) => {
    const subjectOk = subjectFilter === 'Toutes' || doc.subjectName === subjectFilter;
    const levelOk = levelFilter === 'Tous' || doc.level === levelFilter;
    const typeOk = typeFilter === 'Tous' || doc.type === typeFilter;
    const queryOk = !query || `${doc.title} ${doc.subjectName} ${doc.contributorName}`.toLowerCase().includes(query.toLowerCase());
    return subjectOk && levelOk && typeOk && queryOk;
  }), [store.documents, subjectFilter, levelFilter, typeFilter, query]);

  const resetFilters = () => {
    setQuery('');
    setSubjectFilter('Toutes');
    setLevelFilter('Tous');
    setTypeFilter('Tous');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primaryBright]}
            tintColor={theme.primaryBright}
          />
        }
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
          },
        ]}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        
        <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <MaterialIcons name="search" size={22} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une ressource..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filtre Type de document */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Type de document</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['Tous', 'Examen', 'Corrigé', 'Devoir', 'Cours'].map((type) => (
            <Pressable
              key={type}
              onPress={() => setTypeFilter(type)}
              style={[
                styles.chip,
                {
                  borderColor: theme.border,
                  backgroundColor: typeFilter === type ? theme.primary : theme.backgroundElement,
                },
              ]}>
              <Text
                style={{
                  color: typeFilter === type ? '#fff' : theme.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}>
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Filtre Matières */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Matières</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['Toutes', ...store.subjects.map((subject) => subject.name)].map((subject) => (
            <Pressable
              key={subject}
              onPress={() => setSubjectFilter(subject)}
              style={[
                styles.chip,
                {
                  borderColor: theme.border,
                  backgroundColor: subjectFilter === subject ? theme.primary : theme.backgroundElement,
                },
              ]}>
              <Text
                style={{
                  color: subjectFilter === subject ? '#fff' : theme.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}>
                {subject}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Filtre Niveau */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Niveau d’étude</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['Tous', 'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2'].map((level) => (
            <Pressable
              key={level}
              onPress={() => setLevelFilter(level)}
              style={[
                styles.chip,
                {
                  borderColor: theme.border,
                  backgroundColor: levelFilter === level ? theme.primary : theme.backgroundElement,
                },
              ]}>
              <Text
                style={{
                  color: levelFilter === level ? '#fff' : theme.text,
                  fontWeight: '700',
                  fontSize: 13,
                }}>
                {level}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.resultHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Résultats</Text>
          <Text style={{ color: theme.textSecondary }}>{results.length} document(s)</Text>
        </View>

        {results.length ? (
          results.map((document) => (
            <Pressable
              key={document.id}
              onPress={() => router.push(`/documents/${document.id}`)}
              style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={[styles.cardIcon, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialIcons name="description" size={22} color={theme.primaryBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{document.title}</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {document.type} · {document.subjectName} · {document.level} · {document.academicYear}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Aucun document trouvé"
            description="Modifiez vos mots-clés ou réinitialisez les filtres sélectionnés."
            actionLabel="Réinitialiser les filtres"
            onAction={resetFilters}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 16 },
  search: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: '100%', paddingHorizontal: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 16 },
  chips: { gap: 8, paddingVertical: 8 },
  chip: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },
});
