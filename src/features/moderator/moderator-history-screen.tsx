import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import type { ModerationAction, ValidationStatus } from '@/types/models';
import { ModeratorHeader } from './components/moderator-header';

type DecisionFilter = 'all' | ValidationStatus;

const DECISION_COLORS: Record<string, string> = {
  Vérifié: '#16A34A',
  Rejeté: '#B42318',
  Contesté: '#D97706',
};

function HistoryItem({ action }: { action: ModerationAction }) {
  const theme = useTheme();
  const color = DECISION_COLORS[action.decision] ?? '#6B7280';
  const dateStr = new Date(action.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.item, { borderColor: theme.border }]}>
      <View style={[styles.decisionIndicator, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
        <MaterialIcons
          name={
            action.decision === 'Vérifié'
              ? 'check-circle'
              : action.decision === 'Rejeté'
              ? 'cancel'
              : 'warning'
          }
          size={22}
          color={color}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
          {action.documentTitle}
        </Text>
        {action.reason ? (
          <Text style={[styles.itemReason, { color: theme.textSecondary }]} numberOfLines={1}>
            {action.reason}
          </Text>
        ) : null}
        <Text style={[styles.itemDate, { color: theme.textSecondary }]}>{dateStr}</Text>
      </View>
      <View style={[styles.decisionBadge, { backgroundColor: `${color}18` }]}>
        <Text style={[styles.decisionBadgeText, { color }]}>{action.decision}</Text>
      </View>
    </View>
  );
}

export default function ModeratorHistoryScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [filter, setFilter] = useState<DecisionFilter>('all');

  const history = store.moderationHistory ?? [];

  const totalDecisions = history.length;
  const verifiedCount = history.filter((h) => h.decision === 'Vérifié').length;
  const rejectedCount = history.filter((h) => h.decision === 'Rejeté').length;
  const disputedCount = history.filter((h) => h.decision === 'Contesté').length;
  const approvalRate = totalDecisions > 0 ? Math.round((verifiedCount / totalDecisions) * 100) : 0;

  const filtered = history.filter((h) => filter === 'all' || h.decision === filter);

  const filters: { key: DecisionFilter; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'Vérifié', label: 'Validés' },
    { key: 'Rejeté', label: 'Rejetés' },
    { key: 'Contesté', label: 'Contestés' },
  ];

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
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>

        <ModeratorHeader
          title="Historique de Modération"
          subtitle={`${totalDecisions} décision${totalDecisions !== 1 ? 's' : ''} enregistrée${totalDecisions !== 1 ? 's' : ''}`}
        />

        {/* Stats */}
        <View style={[styles.statsBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.statsTitle, { color: theme.text }]}>Mes statistiques</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{verifiedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Validés</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#B42318' }]}>{rejectedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rejetés</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#D97706' }]}>{disputedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Contestés</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{approvalRate}%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Validation</Text>
            </View>
          </View>
        </View>

        {/* Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersBar}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((f) => {
            const color = f.key === 'all' ? '#D97706' : (DECISION_COLORS[f.key] ?? '#D97706');
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? `${color}20` : theme.backgroundElement,
                    borderColor: isActive ? color : theme.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? color : theme.textSecondary }]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Liste */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={56} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune décision</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Vos décisions de modération apparaîtront ici.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((action) => (
              <HistoryItem key={action.id} action={action} />
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
  statsBox: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  statsTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 36, marginHorizontal: 4 },
  filtersBar: { marginBottom: 14 },
  filtersContent: { gap: 8, paddingRight: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  list: { gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  decisionIndicator: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  itemReason: { fontSize: 11 },
  itemDate: { fontSize: 11, marginTop: 2 },
  decisionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  decisionBadgeText: { fontSize: 11, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center' },
});
