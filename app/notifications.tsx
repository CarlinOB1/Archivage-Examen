import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/states';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function NotificationsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Retour</Text></Pressable><Text style={[styles.title, { color: theme.text }]}>Notifications</Text><Pressable onPress={() => { void store.markAllNotificationsRead().catch(() => undefined); }}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Tout lire</Text></Pressable></View>
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: responsive.contentMaxWidth, paddingHorizontal: responsive.horizontalPadding }]}>
        {store.notifications.length ? store.notifications.map((notification) => (
          <Pressable key={notification.id} onPress={() => { void store.markNotificationRead(notification.id).catch(() => undefined); }} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: notification.isRead ? theme.border : theme.primaryBright }]}>
            <View style={[styles.dot, { backgroundColor: notification.isRead ? theme.border : theme.primaryBright }]} />
            <View style={{ flex: 1 }}><Text style={[styles.cardTitle, { color: theme.text }]}>{notification.title}</Text><Text style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 20 }}>{notification.message}</Text><Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 12 }}>{notification.createdAt}</Text></View>
          </Pressable>
        )) : <EmptyState title="Aucune notification" description="Vous êtes à jour." />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800' }, container: { padding: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12 }, dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
});
