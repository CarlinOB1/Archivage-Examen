import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { ModeratorHeader } from './components/moderator-header';

const MODERATOR_COLOR = '#D97706';

export default function ModeratorDashboardScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const pendingDocs = store.documents.filter((d) => d.validationStatus === 'En attente');
  const openReports = store.reports.filter((r) => r.status === 'open' || r.status === 'reviewing');
  const myHistory = store.moderationHistory ?? [];

  // Stats du mois courant (simulé)
  const myDecisionsThisMonth = myHistory.length;
  const verifiedToday = myHistory.filter((h) => h.decision === 'Vérifié').length;
  const rejectedToday = myHistory.filter((h) => h.decision === 'Rejeté').length;
  const disputedToday = myHistory.filter((h) => h.decision === 'Contesté').length;

  const navCards = [
    {
      icon: 'rule' as const,
      label: 'File de validation',
      count: pendingDocs.length,
      route: '/moderator/queue',
      color: '#D97706',
    },
    {
      icon: 'flag' as const,
      label: 'Signalements',
      count: openReports.length,
      route: '/moderator/reports',
      color: '#B42318',
    },
    {
      icon: 'history' as const,
      label: 'Mon historique',
      count: myHistory.length,
      route: '/moderator/history',
      color: '#6366F1',
    },
  ];

  const decisionColor = (d: string) => {
    if (d === 'Vérifié') return '#16A34A';
    if (d === 'Rejeté') return '#B42318';
    return '#D97706';
  };

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
        {/* Header */}
        <ModeratorHeader
          title="Espace Modération"
          subtitle="Révision et validation des dépôts"
          right={
            <Switch
              value={store.isModerator}
              onValueChange={() => store.toggleModeratorMode()}
              trackColor={{ true: MODERATOR_COLOR }}
              thumbColor="#fff"
            />
          }
        />

        {/* KPI Row */}
        <View style={styles.kpiRow}>
          {[
            { label: 'En attente', value: pendingDocs.length, icon: 'pending-actions' as const, color: '#D97706' },
            { label: 'Signalements', value: openReports.length, icon: 'flag' as const, color: '#B42318' },
            { label: 'Mes décisions', value: myDecisionsThisMonth, icon: 'verified' as const, color: '#6366F1' },
          ].map((kpi) => (
            <View
              key={kpi.label}
              style={[styles.kpiCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <MaterialIcons name={kpi.icon} size={22} color={kpi.color} />
              <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA principal */}
        <Pressable
          onPress={() => router.push('/moderator/queue' as any)}
          style={[styles.ctaCard, { backgroundColor: MODERATOR_COLOR }]}
        >
          <View>
            <Text style={styles.ctaTitle}>Commencer la révision</Text>
            <Text style={styles.ctaSubtitle}>
              {pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''} en attente de validation
            </Text>
          </View>
          <MaterialIcons name="arrow-forward" size={28} color="#fff" />
        </Pressable>

        {/* Activité rapide */}
        <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Activité — Mes décisions</Text>
          <View style={styles.activityRow}>
            {[
              { label: 'Validés', value: verifiedToday, color: '#16A34A' },
              { label: 'Rejetés', value: rejectedToday, color: '#B42318' },
              { label: 'Contestés', value: disputedToday, color: '#D97706' },
            ].map((item) => (
              <View key={item.label} style={styles.activityItem}>
                <Text style={[styles.activityValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[styles.activityLabel, { color: theme.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nav cards */}
        <Text style={[styles.navSectionTitle, { color: theme.textSecondary }]}>Navigation</Text>
        <View style={styles.navRow}>
          {navCards.map((card) => (
            <Pressable
              key={card.route}
              onPress={() => router.push(card.route as any)}
              style={[styles.navCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.navIconBox, { backgroundColor: `${card.color}18` }]}>
                <MaterialIcons name={card.icon} size={24} color={card.color} />
              </View>
              <Text style={[styles.navLabel, { color: theme.text }]}>{card.label}</Text>
              {card.count > 0 ? (
                <View style={[styles.navCount, { backgroundColor: `${card.color}22` }]}>
                  <Text style={[styles.navCountText, { color: card.color }]}>{card.count}</Text>
                </View>
              ) : null}
              <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* Dernières décisions */}
        {myHistory.length > 0 ? (
          <>
            <Text style={[styles.navSectionTitle, { color: theme.textSecondary }]}>Dernières décisions</Text>
            <View style={[styles.section, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {myHistory.slice(0, 3).map((action) => (
                <View
                  key={action.id}
                  style={[styles.historyItem, { borderBottomColor: theme.border }]}
                >
                  <View style={[styles.decisionDot, { backgroundColor: decisionColor(action.decision) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>
                      {action.documentTitle}
                    </Text>
                    {action.reason ? (
                      <Text style={[styles.historyReason, { color: theme.textSecondary }]} numberOfLines={1}>
                        {action.reason}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.decisionBadge, { backgroundColor: `${decisionColor(action.decision)}18` }]}>
                    <Text style={[styles.decisionText, { color: decisionColor(action.decision) }]}>
                      {action.decision}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingTop: 16, gap: 0 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { fontSize: 11, textAlign: 'center' },
  ctaCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  ctaTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  ctaSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  section: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  activityItem: { alignItems: 'center', gap: 4 },
  activityValue: { fontSize: 24, fontWeight: '800' },
  activityLabel: { fontSize: 12 },
  navSectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  navRow: { gap: 8, marginBottom: 14 },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  navIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  navCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  navCountText: { fontSize: 12, fontWeight: '800' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  decisionDot: { width: 8, height: 8, borderRadius: 4 },
  historyTitle: { fontSize: 13, fontWeight: '700' },
  historyReason: { fontSize: 11, marginTop: 2 },
  decisionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  decisionText: { fontSize: 11, fontWeight: '800' },
});
