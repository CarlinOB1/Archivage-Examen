import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/states';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function NotificationsScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        {store.notifications.some((n) => !n.isRead) ? (
          <Pressable onPress={() => { void store.markAllNotificationsRead().catch(() => undefined); }}>
            <Text style={{ color: theme.primaryBright, fontWeight: '700', fontSize: 13 }}>Tout lire</Text>
          </Pressable>
        ) : <View style={{ width: 48 }} />}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { maxWidth: responsive.contentMaxWidth, paddingHorizontal: responsive.horizontalPadding },
        ]}>
        {store.notifications.length ? (
          store.notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => {
                void store.markNotificationRead(notification.id).catch(() => undefined);
              }}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: notification.isRead ? theme.border : theme.primaryBright,
                },
              ]}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: notification.isRead
                      ? theme.backgroundSelected
                      : `${theme.primaryBright}20`,
                  },
                ]}>
                <MaterialIcons
                  name={notification.isRead ? 'notifications-none' : 'notifications-active'}
                  size={20}
                  color={notification.isRead ? theme.textSecondary : theme.primaryBright}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{notification.title}</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4, lineHeight: 20 }}>
                  {notification.message}
                </Text>
                <Text style={{ color: theme.textSecondary, marginTop: 8, fontSize: 12 }}>
                  {notification.createdAt}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Aucune notification"
            description="Vous êtes à jour. Vous recevrez ici les validations de vos dépôts et les actualités."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800' },
  container: { padding: 16, maxWidth: 800, width: '100%', alignSelf: 'center' },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },
});
