import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppStore } from '@/stores/app-store';
import { AdminHeader } from './components/admin-header';
import { AdminStatCard } from './components/admin-stat-card';
import { AdminBadge } from './components/admin-badge';
import { ConfirmDialog } from '@/components/ui/states';

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [rejectDialogDocId, setRejectDialogDocId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await store.refresh();
      await store.refreshAdminData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickValidate = async (id: string) => {
    setActionLoadingId(id);
    try {
      await store.validateDocument(id, 'Vérifié');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickReject = async () => {
    if (!rejectDialogDocId) return;
    setActionLoadingId(rejectDialogDocId);
    try {
      await store.validateDocument(rejectDialogDocId, 'Rejeté');
    } finally {
      setActionLoadingId(null);
      setRejectDialogDocId(null);
    }
  };

  const pendingDocuments = store.documents.filter((d) => d.validationStatus === 'En attente');
  const openReports = store.reports.filter((r) => r.status === 'open' || r.status === 'reviewing');

  const navCards: {
    title: string;
    subtitle: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    route: string;
    badgeCount?: number;
    badgeColor?: string;
    color: string;
  }[] = [
    {
      title: 'Modération des Documents',
      subtitle: `${pendingDocuments.length} en attente de vérification`,
      icon: 'rule',
      route: '/admin/documents',
      badgeCount: pendingDocuments.length,
      badgeColor: '#D97706',
      color: theme.primaryBright,
    },
    {
      title: 'Gestion des Signalements',
      subtitle: `${openReports.length} signalements nécessitent votre attention`,
      icon: 'report-problem',
      route: '/admin/reports',
      badgeCount: openReports.length,
      badgeColor: '#DC2626',
      color: '#DC2626',
    },
    {
      title: 'Catalogue des Matières',
      subtitle: `${store.subjects.length} matières répertoriées`,
      icon: 'category',
      route: '/admin/subjects',
      color: '#059669',
    },
    {
      title: 'Annuaire des Utilisateurs',
      subtitle: `${store.adminUsers.length} étudiants et contributeurs`,
      icon: 'people-alt',
      route: '/admin/users',
      color: '#7C3AED',
    },
    {
      title: 'Diffuser une Notification',
      subtitle: 'Envoyer une annonce générale ou ciblée',
      icon: 'campaign',
      route: '/admin/notifications',
      color: '#2563EB',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {rejectDialogDocId ? (
        <ConfirmDialog
          title="Rejeter ce document ?"
          message="Le contributeur sera notifié du rejet et le document ne sera pas publié."
          confirmLabel="Confirmer le rejet"
          onCancel={() => setRejectDialogDocId(null)}
          onConfirm={() => void handleQuickReject()}
        />
      ) : null}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
          },
        ]}>
        {/* En-tête avec navigation de retour et badge Super-Admin */}
        <AdminHeader
          title="Administration"
          subtitle="Supervision, modération et gestion globale de la bibliothèque"
          badge="Modérateur"
          onBack={() => router.replace('/(tabs)/profile')}
          rightAction={
            <Pressable
              onPress={() => void onRefresh()}
              style={[
                styles.refreshBtn,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <MaterialIcons name="refresh" size={20} color={theme.text} />
            </Pressable>
          }
        />

        {/* Bannière de mode démo / privilèges */}
        <View
          style={[
            styles.roleBanner,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={styles.roleBannerLeft}>
            <View style={[styles.roleIconBox, { backgroundColor: `${theme.primary}20` }]}>
              <MaterialIcons name="security" size={20} color={theme.primaryBright} />
            </View>
            <View>
              <Text style={[styles.roleBannerTitle, { color: theme.text }]}>
                Privilèges Administrateur Actifs
              </Text>
              <Text style={[styles.roleBannerSubtitle, { color: theme.textSecondary }]}>
                Connecté en tant que modérateur académique
              </Text>
            </View>
          </View>
          <View style={styles.roleSwitchWrapper}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>
              Rôle Admin
            </Text>
            <Switch
              value={store.isAdmin}
              onValueChange={store.toggleAdminMode}
              trackColor={{ true: theme.primaryBright }}
            />
          </View>
        </View>

        {/* 4 Indicateurs Clés (KPI Stats) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Indicateurs Clés</Text>
        <View style={styles.kpiGrid}>
          <AdminStatCard
            title="À Valider"
            value={store.adminStats.pendingDocuments}
            subtitle="Documents en attente"
            icon="hourglass-top"
            color="#D97706"
            badge={store.adminStats.pendingDocuments > 0 ? 'Prioritaire' : 'À jour'}
            badgeColor={store.adminStats.pendingDocuments > 0 ? '#D97706' : '#16A34A'}
            onPress={() => router.push('/admin/documents')}
          />
          <AdminStatCard
            title="Signalements"
            value={store.adminStats.openReports}
            subtitle="Incidents ouverts"
            icon="report-problem"
            color="#DC2626"
            badge={store.adminStats.openReports > 0 ? 'Urgent' : 'Zéro plainte'}
            badgeColor={store.adminStats.openReports > 0 ? '#DC2626' : '#16A34A'}
            onPress={() => router.push('/admin/reports')}
          />
          <AdminStatCard
            title="Documents"
            value={store.adminStats.totalDocuments}
            subtitle={`${store.adminStats.verifiedDocuments} vérifiés`}
            icon="folder"
            color={theme.primaryBright}
            onPress={() => router.push('/admin/documents')}
          />
          <AdminStatCard
            title="Téléchargements"
            value={store.adminStats.totalDownloads}
            subtitle="Accès étudiants"
            icon="file-download"
            color="#16A34A"
          />
        </View>

        {/* Accès rapide aux modules */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          Gestion & Modules
        </Text>
        <View style={styles.navGrid}>
          {navCards.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                pressed && { opacity: 0.8 },
              ]}>
              <View style={[styles.navIconBox, { backgroundColor: `${item.color}15` }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.navTitleRow}>
                  <Text style={[styles.navCardTitle, { color: theme.text }]}>{item.title}</Text>
                  {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                    <View style={[styles.countBadge, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.countBadgeText}>{item.badgeCount}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.navCardSubtitle, { color: theme.textSecondary }]}>
                  {item.subtitle}
                </Text>
              </View>

              <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* File d'attente urgente (Documents à valider) */}
        <View style={styles.headerWithAction}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Documents en attente ({pendingDocuments.length})
          </Text>
          {pendingDocuments.length > 0 ? (
            <Pressable onPress={() => router.push('/admin/documents')}>
              <Text style={[styles.seeAllText, { color: theme.primaryBright }]}>Tout voir</Text>
            </Pressable>
          ) : null}
        </View>

        {pendingDocuments.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <MaterialIcons name="check-circle" size={36} color="#16A34A" />
            <Text style={[styles.emptyBoxTitle, { color: theme.text }]}>
              Aucun document en attente
            </Text>
            <Text style={[styles.emptyBoxSubtitle, { color: theme.textSecondary }]}>
              Tous les documents déposés ont été vérifiés ou traités.
            </Text>
          </View>
        ) : (
          pendingDocuments.slice(0, 3).map((doc) => {
            const isLoading = actionLoadingId === doc.id;
            return (
              <View
                key={doc.id}
                style={[
                  styles.urgentCard,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={styles.urgentCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.urgentCardTitle, { color: theme.text }]}>
                      {doc.title}
                    </Text>
                    <Text style={[styles.urgentCardMeta, { color: theme.textSecondary }]}>
                      {doc.subjectName} · {doc.level} · Déposé par {doc.contributorName}
                    </Text>
                  </View>
                  <AdminBadge type="validation" value={doc.validationStatus} />
                </View>

                {doc.description ? (
                  <Text
                    numberOfLines={2}
                    style={[styles.urgentCardDesc, { color: theme.textSecondary }]}>
                    {doc.description}
                  </Text>
                ) : null}

                <View style={styles.urgentCardActions}>
                  <Pressable
                    onPress={() => router.push(`/documents/${doc.id}`)}
                    style={[styles.actionBtn, { borderColor: theme.border }]}>
                    <MaterialIcons name="visibility" size={16} color={theme.text} />
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>Consulter</Text>
                  </Pressable>

                  <Pressable
                    disabled={isLoading}
                    onPress={() => setRejectDialogDocId(doc.id)}
                    style={[styles.actionBtn, styles.rejectBtn]}>
                    <MaterialIcons name="close" size={16} color="#DC2626" />
                    <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Rejeter</Text>
                  </Pressable>

                  <Pressable
                    disabled={isLoading}
                    onPress={() => void handleQuickValidate(doc.id)}
                    style={[styles.actionBtn, styles.approveBtn]}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="check" size={16} color="#fff" />
                        <Text style={[styles.actionBtnText, { color: '#fff' }]}>Valider</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        {/* Derniers signalements */}
        <View style={[styles.headerWithAction, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Signalements récents ({openReports.length})
          </Text>
          {openReports.length > 0 ? (
            <Pressable onPress={() => router.push('/admin/reports')}>
              <Text style={[styles.seeAllText, { color: theme.primaryBright }]}>Tout voir</Text>
            </Pressable>
          ) : null}
        </View>

        {openReports.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <MaterialIcons name="thumb-up" size={36} color="#16A34A" />
            <Text style={[styles.emptyBoxTitle, { color: theme.text }]}>
              Aucun signalement en attente
            </Text>
            <Text style={[styles.emptyBoxSubtitle, { color: theme.textSecondary }]}>
              La bibliothèque fonctionne sans incident signalé.
            </Text>
          </View>
        ) : (
          openReports.slice(0, 3).map((rep) => (
            <Pressable
              key={rep.id}
              onPress={() => router.push('/admin/reports')}
              style={[
                styles.reportCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={styles.reportCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reportDocTitle, { color: theme.text }]}>
                    {rep.documentTitle}
                  </Text>
                  <Text style={[styles.reportReason, { color: '#DC2626' }]}>
                    Motif : {rep.reasonLabel}
                  </Text>
                </View>
                <AdminBadge type="report" value={rep.status} />
              </View>

              <Text numberOfLines={2} style={[styles.reportComment, { color: theme.textSecondary }]}>
                « {rep.comment} »
              </Text>

              <View style={styles.reportFooter}>
                <Text style={[styles.reportMeta, { color: theme.textSecondary }]}>
                  Signalé par {rep.reporterName} · {rep.createdAt}
                </Text>
                <MaterialIcons name="chevron-right" size={18} color={theme.textSecondary} />
              </View>
            </Pressable>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', alignSelf: 'center', padding: 20 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  roleSwitchWrapper: {
    alignItems: 'flex-end',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  navGrid: {
    gap: 10,
    marginBottom: 24,
  },
  navCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  navCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  headerWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyBoxSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  urgentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  urgentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  urgentCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  urgentCardMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  urgentCardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  urgentCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  approveBtn: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 8,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  reportDocTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  reportReason: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  reportComment: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  reportMeta: {
    fontSize: 11,
  },
});
