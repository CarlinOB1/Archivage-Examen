import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import type { DocumentReport, ReportStatus } from '@/types/models';
import { ModeratorHeader } from './components/moderator-header';

type TabFilter = 'pending' | 'reviewing' | 'resolved' | 'all';

const TAB_LABELS: Record<TabFilter, string> = {
  pending: 'À traiter',
  reviewing: 'En examen',
  resolved: 'Résolus',
  all: 'Tous',
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  open: '#B42318',
  reviewing: '#D97706',
  resolved: '#16A34A',
  dismissed: '#6B7280',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Ouvert',
  reviewing: 'En examen',
  resolved: 'Résolu',
  dismissed: 'Classé',
};

function ReportCard({ report }: { report: DocumentReport }) {
  const theme = useTheme();
  const store = useAppStore();
  const statusColor = STATUS_COLORS[report.status];

  async function updateStatus(newStatus: ReportStatus) {
    await store.updateReportStatus(report.id, newStatus);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {/* Status + date */}
      <View style={styles.cardTop}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[report.status]}</Text>
        </View>
        <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{report.createdAt}</Text>
      </View>

      {/* Document title */}
      <Text style={[styles.docTitle, { color: theme.text }]} numberOfLines={2}>
        {report.documentTitle}
      </Text>
      {report.documentSubject ? (
        <Text style={[styles.subjectText, { color: theme.textSecondary }]}>
          Matière : {report.documentSubject}
        </Text>
      ) : null}

      {/* Reason */}
      <View style={[styles.reasonBox, { backgroundColor: `${statusColor}08`, borderColor: `${statusColor}30` }]}>
        <MaterialIcons name="flag" size={14} color={statusColor} />
        <Text style={[styles.reasonText, { color: theme.text }]}>{report.reasonLabel}</Text>
      </View>

      {/* Comment */}
      {report.comment ? (
        <Text style={[styles.commentText, { color: theme.textSecondary }]} numberOfLines={2}>
          {`« ${report.comment} »`}
        </Text>
      ) : null}

      {/* Reporter */}
      <Text style={[styles.reporterText, { color: theme.textSecondary }]}>
        Signalé par {report.reporterName}
      </Text>

      {/* Actions selon statut */}
      <View style={styles.cardActions}>
        {report.status === 'open' ? (
          <Pressable
            onPress={() => updateStatus('reviewing')}
            style={[styles.actionBtn, { backgroundColor: '#D97706' }]}
          >
            <MaterialIcons name="assignment-ind" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Prendre en charge</Text>
          </Pressable>
        ) : null}
        {report.status === 'reviewing' ? (
          <>
            <Pressable
              onPress={() => updateStatus('resolved')}
              style={[styles.actionBtn, { backgroundColor: '#16A34A', flex: 1 }]}
            >
              <MaterialIcons name="check" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Résoudre</Text>
            </Pressable>
            <Pressable
              onPress={() => updateStatus('dismissed')}
              style={[styles.actionBtn, { backgroundColor: '#6B7280', flex: 1 }]}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Classer</Text>
            </Pressable>
          </>
        ) : null}
        {(report.status === 'resolved' || report.status === 'dismissed') ? (
          <View style={[styles.resolvedNote, { borderColor: theme.border }]}>
            <MaterialIcons
              name={report.status === 'resolved' ? 'check-circle' : 'do-not-disturb'}
              size={16}
              color={statusColor}
            />
            <Text style={[styles.resolvedNoteText, { color: theme.textSecondary }]}>
              {report.status === 'resolved' ? 'Signalement résolu' : 'Classé sans suite'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ModeratorReportsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');

  const filtered = store.reports.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return r.status === 'open';
    if (activeTab === 'reviewing') return r.status === 'reviewing';
    if (activeTab === 'resolved') return r.status === 'resolved' || r.status === 'dismissed';
    return true;
  });

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
          title="Signalements"
          subtitle={`${store.reports.filter((r) => r.status === 'open').length} signalements à traiter`}
        />

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsBar}
          contentContainerStyle={styles.tabsContent}
        >
          {(Object.keys(TAB_LABELS) as TabFilter[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab ? '#D9770620' : theme.backgroundElement,
                  borderColor: activeTab === tab ? '#D97706' : theme.border,
                },
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#D97706' : theme.textSecondary }]}>
                {TAB_LABELS[tab]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Liste */}
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="flag" size={56} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>Aucun signalement ici</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
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
  tabsBar: { marginBottom: 14 },
  tabsContent: { gap: 8, paddingRight: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  list: { gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  cardDate: { fontSize: 11 },
  docTitle: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  subjectText: { fontSize: 12 },
  reasonBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  reasonText: { fontSize: 13, fontWeight: '600', flex: 1 },
  commentText: { fontSize: 12, fontStyle: 'italic' },
  reporterText: { fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  resolvedNote: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  resolvedNoteText: { fontSize: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700' },
});
