import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/states';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function SearchScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const params = useLocalSearchParams<{ query?: string }>();
  const store = useAppStore();

  const [query, setQuery] = useState(typeof params.query === 'string' ? params.query : '');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return store.documents.filter(
      (doc) =>
        `${doc.title} ${doc.subjectName} ${doc.contributorName} ${doc.level} ${doc.type}`
          .toLowerCase()
          .includes(q)
    );
  }, [query, store.documents]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Recherche</Text>
      </View>

      <View
        style={[
          styles.search,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            marginHorizontal: responsive.horizontalPadding,
          },
        ]}>
        <MaterialIcons name="search" size={22} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="Matière, examen, corrigé ou cours..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
        {query ? (
          <Pressable
            accessibilityLabel="Effacer la recherche"
            onPress={() => setQuery('')}
            hitSlop={8}>
            <MaterialIcons name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.results}>
        {!query ? (
          <EmptyState
            title="Que recherchez-vous ?"
            description="Entrez un mot-clé (ex. Réseaux, Algorithmique, L2, Examen...) pour trouver les documents correspondants."
          />
        ) : results.length ? (
          results.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push(`/documents/${doc.id}`)}
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={[styles.cardIcon, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialIcons name="description" size={22} color={theme.primaryBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{doc.title}</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {doc.type} · {doc.subjectName} · {doc.level} · {doc.academicYear}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Aucun document trouvé"
            description={`Aucune ressource ne correspond à « ${query} ».`}
            actionLabel="Effacer la recherche"
            onAction={() => setQuery('')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  backText: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  search: {
    margin: 20,
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: { flex: 1, height: '100%', paddingHorizontal: 10, fontSize: 16 },
  results: { paddingHorizontal: 20, paddingBottom: 30 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
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
