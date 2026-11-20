import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppStore } from '@/stores/app-store';
import { AdminHeader } from './components/admin-header';
import { AdminBadge } from './components/admin-badge';
import { ConfirmDialog } from '@/components/ui/states';
import type { ReportStatus } from '@/types/models';

type FilterTab = 'ALL' | ReportStatus;

export default function AdminReportsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterTab>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmDismissId, setConfirmDismissId] = useState<string | null>(null);

  const openCount = store.reports.filter((r) => r.status === 'open').length;
  const reviewingCount = store.reports.filter((r) => r.status === 'reviewing').length;

  const filteredReports = useMemo(() => {
    return store.reports.filter((rep) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        rep.documentTitle.toLowerCase().includes(q) ||
        rep.reasonLabel.toLowerCase().includes(q) ||
        rep.reporterName.toLowerCase().includes(q) ||
        rep.comment.toLowerCase().includes(q);

      const matchStatus = selectedStatus === 'ALL' || rep.status === selectedStatus;

      return matchQuery && matchStatus;
    });
  }, [store.reports, searchQuery, selectedStatus]);

  const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
    setActionLoadingId(reportId);
    try {
      await store.updateReportStatus(reportId, status);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDismiss = async () => {
    if (!confirmDismissId) return;
    setActionLoadingId(confirmDismissId);
    try {
      await store.updateReportStatus(confirmDismissId, 'dismissed');
    } finally {
      setActionLoadingId(null);
      setConfirmDismissId(null);
    }
  };

  const handleToggleDoc = async (documentId: string) => {
    setActionLoadingId(`doc-${documentId}`);
    try {
      await store.toggleDocumentAvailability(documentId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusTabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: 'ALL', label: 'Tous', badge: store.reports.length },
    { key: 'open', label: 'À traiter', badge: openCount },
    { key: 'reviewing', label: 'En examen', badge: reviewingCount },
    { key: 'resolved', label: 'Résolus' },
    { key: 'dismissed', label: 'Sans suite' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {confirmDismissId ? (
        <ConfirmDialog
          title="Classer sans suite ?"
          message="Le signalement sera archivé sans modification sur le document ciblé."
          confirmLabel="Classer"
          onCancel={() => setConfirmDismissId(null)}
          onConfirm={() => void handleConfirmDismiss()}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
          },
        ]}>
        <AdminHeader
          title="Gestion des Signalements"
          subtitle="Suivi de la conformité, signalements de contenu et modération"
          badge={`${openCount + reviewingCount} en cours`}
        />

        {/* Barre de recherche */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <MaterialIcons name="search" size={22} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par document, motif, commentaire, déclarant..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Onglets de filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabs}>
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedStatus(tab.key)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.tabChipText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}>
                  {tab.label}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 ? (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.25)'
                          : tab.key === 'open'
                            ? '#DC2626'
                            : '#D97706',
                      },
                    ]}>
                    <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
          {filteredReports.length} signalement{filteredReports.length > 1 ? 's' : ''}
        </Text>

        {filteredReports.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <MaterialIcons name="check-circle" size={42} color="#16A34A" />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aucun signalement dans cette section
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Tous les signalements ont été résolus ou aucun signalement ne correspond.
            </Text>
          </View>
        ) : (
          filteredReports.map((rep) => {
            const isActing = actionLoadingId === rep.id;
            const doc = store.documents.find((d) => d.id === rep.documentId);
            const isDocLoading = actionLoadingId === `doc-${rep.documentId}`;

            return (
              <View
                key={rep.id}
                style={[
                  styles.reportCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={styles.reportCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <View style={[styles.reasonBadge, { backgroundColor: '#FEE2E2' }]}>
                        <MaterialIcons name="report" size={14} color="#DC2626" />
                        <Text style={styles.reasonBadgeText}>{rep.reasonLabel}</Text>
                      </View>
                      <AdminBadge type="report" value={rep.status} />
                    </View>

                    <Text style={[styles.docTitle, { color: theme.text }]}>
                      {rep.documentTitle}
                    </Text>
                    {rep.documentSubject ? (
                      <Text style={[styles.subjectTag, { color: theme.primaryBright }]}>
                        Matière : {rep.documentSubject}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Commentaire de l'étudiant */}
                <View style={[styles.commentBox, { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={[styles.commentText, { color: theme.text }]}>
                    « {rep.comment} »
                  </Text>
                  <Text style={[styles.reporterMeta, { color: theme.textSecondary }]}>
                    Par {rep.reporterName} · {rep.createdAt}
                  </Text>
                </View>

                {/* État du document lié */}
                {doc ? (
                  <View style={styles.linkedDocRow}>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                      Statut document :
                    </Text>
                    <AdminBadge type="validation" value={doc.validationStatus} />
                    <AdminBadge type="availability" value={doc.availabilityStatus} />
                  </View>
                ) : null}

                {/* Actions de traitement du signalement */}
                <View style={styles.actionRow}>
                  {/* Si ouvert -> En cours */}
                  {rep.status === 'open' ? (
                    <Pressable
                      disabled={isActing}
                      onPress={() => void handleUpdateStatus(rep.id, 'reviewing')}
                      style={[styles.btn, styles.reviewingBtn]}>
                      {isActing ? (
                        <ActivityIndicator size="small" color="#D97706" />
                      ) : (
                        <>
                          <MaterialIcons name="hourglass-bottom" size={16} color="#D97706" />
                          <Text style={[styles.btnText, { color: '#D97706' }]}>Prendre en charge</Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {/* Résoudre */}
                  {rep.status !== 'resolved' ? (
                    <Pressable
                      disabled={isActing}
                      onPress={() => void handleUpdateStatus(rep.id, 'resolved')}
                      style={[styles.btn, styles.resolveBtn]}>
                      {isActing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="done-all" size={16} color="#fff" />
                          <Text style={[styles.btnText, { color: '#fff' }]}>Résoudre</Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {/* Classer sans suite */}
                  {rep.status !== 'dismissed' ? (
                    <Pressable
                      disabled={isActing}
                      onPress={() => setConfirmDismissId(rep.id)}
                      style={[styles.btn, styles.dismissBtn]}>
                      <MaterialIcons name="close" size={16} color="#64748B" />
                      <Text style={[styles.btnText, { color: '#64748B' }]}>Sans suite</Text>
                    </Pressable>
                  ) : null}

                  {/* Consulter le document */}
                  {doc ? (
                    <Pressable
                      onPress={() => router.push(`/documents/${doc.id}`)}
                      style={[styles.iconBtn, { borderColor: theme.border }]}>
                      <MaterialIcons name="launch" size={18} color={theme.primaryBright} />
                    </Pressable>
                  ) : null}

                  {/* Masquer le document incriminé */}
                  {doc ? (
                    <Pressable
                      disabled={isDocLoading}
                      onPress={() => void handleToggleDoc(doc.id)}
                      style={[
                        styles.iconBtn,
                        {
                          borderColor: theme.border,
                          backgroundColor:
                            doc.availabilityStatus === 'Disponible'
                              ? theme.backgroundSelected
                              : '#FEF3C7',
                        },
                      ]}>
                      <MaterialIcons
                        name={doc.availabilityStatus === 'Disponible' ? 'visibility-off' : 'visibility'}
                        size={18}
                        color={doc.availabilityStatus === 'Disponible' ? theme.textSecondary : '#D97706'}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', alignSelf: 'center', padding: 20 },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  statusTabs: {
    gap: 8,
    marginBottom: 14,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reasonBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  subjectTag: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  commentBox: {
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  reporterMeta: {
    fontSize: 11,
    textAlign: 'right',
  },
  linkedDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  reviewingBtn: {
    backgroundColor: '#FEF3C7',
  },
  resolveBtn: {
    backgroundColor: '#16A34A',
  },
  dismissBtn: {
    backgroundColor: '#F1F5F9',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
