import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import type { AcademicDocument } from '@/types/models';
import { ModeratorHeader } from './components/moderator-header';

const TYPE_COLORS: Record<string, string> = {
  Examen: '#173F73',
  'Corrigé': '#16A34A',
  Devoir: '#D97706',
  Cours: '#6366F1',
};

function DocCard({ doc }: { doc: AcademicDocument }) {
  const theme = useTheme();
  const typeColor = TYPE_COLORS[doc.type] ?? '#173F73';
  const waitingTime = doc.createdAt ?? 'Récent';

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {/* Header de la carte */}
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>{doc.type}</Text>
        </View>
        <Text style={[styles.waitDate, { color: theme.textSecondary }]}>
          <MaterialIcons name="schedule" size={12} color={theme.textSecondary} /> {waitingTime}
        </Text>
      </View>

      {/* Titre */}
      <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
        {doc.title}
      </Text>

      {/* Méta */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialIcons name="subject" size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{doc.subjectName}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="school" size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{doc.level}</Text>
        </View>
        <View style={styles.metaItem}>
          <MaterialIcons name="calendar-today" size={14} color={theme.textSecondary} />
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>{doc.academicYear}</Text>
        </View>
      </View>

      {/* Contributeur */}
      <View style={styles.contributorRow}>
        <MaterialIcons name="person-outline" size={14} color={theme.textSecondary} />
        <Text style={[styles.contributorText, { color: theme.textSecondary }]}>
          Déposé par {doc.contributorName || 'Anonyme'}
        </Text>
      </View>

      {/* Description */}
      {doc.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
          {doc.description}
        </Text>
      ) : null}

      {/* Actions */}
      <View style={styles.cardActions}>
        <Pressable
          onPress={() => router.push(`/documents/${doc.id}` as any)}
          style={[styles.actionBtn, styles.consultBtn, { borderColor: theme.border }]}
        >
          <MaterialIcons name="visibility" size={16} color={theme.primaryBright} />
          <Text style={[styles.actionBtnText, { color: theme.primaryBright }]}>Consulter</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/moderator/review/${doc.id}` as any)}
          style={[styles.actionBtn, styles.reviewBtn]}
        >
          <MaterialIcons name="rate-review" size={16} color="#fff" />
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>Réviser</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ModeratorQueueScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const pendingDocs = store.documents.filter((d) => d.validationStatus === 'En attente');

  const filteredDocs = selectedSubject
    ? pendingDocs.filter((d) => d.subjectId === selectedSubject || d.subjectName === selectedSubject)
    : pendingDocs;

  const subjectFilters = Array.from(new Set(pendingDocs.map((d) => d.subjectName))).filter(Boolean);

  async function handleRefresh() {
    setRefreshing(true);
    await store.refresh().catch(() => undefined);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Back + header */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>

        <ModeratorHeader
          title="File de validation"
          subtitle={`${pendingDocs.length} document${pendingDocs.length !== 1 ? 's' : ''} en attente`}
        />

        {/* Filtres par matière */}
        {subjectFilters.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersBar}
            contentContainerStyle={styles.filtersContent}
          >
            <Pressable
              onPress={() => setSelectedSubject(null)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: !selectedSubject ? '#D9770620' : theme.backgroundElement,
                  borderColor: !selectedSubject ? '#D97706' : theme.border,
                },
              ]}
            >
              <Text style={[styles.filterChipText, { color: !selectedSubject ? '#D97706' : theme.textSecondary }]}>
                Toutes
              </Text>
            </Pressable>
            {subjectFilters.map((subject) => (
              <Pressable
                key={subject}
                onPress={() => setSelectedSubject(subject)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedSubject === subject ? '#D9770620' : theme.backgroundElement,
                    borderColor: selectedSubject === subject ? '#D97706' : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedSubject === subject ? '#D97706' : theme.textSecondary },
                  ]}
                >
                  {subject}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* Liste */}
        {filteredDocs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="check-circle-outline" size={64} color="#16A34A" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>File vide !</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tous les documents ont été traités. Revenez plus tard.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingTop: 16, gap: 0 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 15, fontWeight: '700' },
  filtersBar: { marginBottom: 14 },
  filtersContent: { gap: 8, paddingRight: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  list: { gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  waitDate: { fontSize: 11 },
  cardTitle: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  contributorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contributorText: { fontSize: 12 },
  description: { fontSize: 12, lineHeight: 17 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  consultBtn: { borderWidth: 1 },
  reviewBtn: { backgroundColor: '#D97706' },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
