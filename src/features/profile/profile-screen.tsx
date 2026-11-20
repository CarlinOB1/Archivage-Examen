import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function ProfileScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [logout, setLogout] = useState(false);

  const myUploadsCount = store.documents.filter(
    (d) =>
      d.contributorName === `${store.user.firstName} ${store.user.lastName}`.trim() ||
      d.contributorName === store.user.email
  ).length;

  const options: { label: string; route: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { label: 'Modifier mon profil académique', route: '/profile/edit', icon: 'edit' },
    { label: 'Mes notifications', route: '/notifications', icon: 'notifications-none' },
    { label: 'Paramètres & Préférences', route: '/settings', icon: 'settings' },
  ];

  const fullName = `${store.user.firstName} ${store.user.lastName}`.trim() || 'Étudiant';
  const initials = `${store.user.firstName?.[0] ?? 'E'}${store.user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {logout ? (
        <ConfirmDialog
          title="Se déconnecter ?"
          message="Vous devrez vous reconnecter pour déposer des documents ou gérer vos favoris."
          confirmLabel="Déconnecter"
          onCancel={() => setLogout(false)}
          onConfirm={() => {
            void store.logout().then(() => {
              setLogout(false);
              router.replace('/auth/login');
            }).catch(() => undefined);
          }}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
          },
        ]}>
        <Text style={[styles.title, { color: theme.text }]}>Mon Profil</Text>

        {/* Carte Identité */}
        <View style={[styles.profileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{fullName}</Text>
            <Text style={{ color: theme.textSecondary }}>{store.user.email || 'Non renseigné'}</Text>
          </View>
        </View>

        {/* Statistiques Étudiant */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <MaterialIcons name="bookmark" size={22} color={theme.primaryBright} />
            <Text style={[styles.statValue, { color: theme.text }]}>{store.favorites.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Favoris</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <MaterialIcons name="cloud-upload" size={22} color={theme.success} />
            <Text style={[styles.statValue, { color: theme.text }]}>{myUploadsCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Mes dépôts</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <MaterialIcons name="school" size={22} color={theme.warning} />
            <Text style={[styles.statValue, { color: theme.text }]}>{store.user.level || 'L3'}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Niveau</Text>
          </View>
        </View>

        {/* Détails académiques */}
        <View style={[styles.info, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.infoSectionTitle, { color: theme.text }]}>Cursus Universitaire</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="account-balance" size={18} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Établissement :</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {store.user.university || 'Université Marien Ngouabi'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="menu-book" size={18} color={theme.textSecondary} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Filière :</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {store.user.programme || 'Informatique'}
            </Text>
          </View>
        </View>

        {/* Menu de navigation */}
        <View style={styles.options}>
          {options.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.optionLeft}>
                <MaterialIcons name={item.icon} size={20} color={theme.primaryBright} />
                <Text style={{ color: theme.text, fontWeight: '700' }}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* Déconnexion */}
        <Pressable onPress={() => setLogout(true)} style={styles.logout}>
          <MaterialIcons name="logout" size={20} color="#B42318" />
          <Text style={{ color: '#B42318', fontWeight: '800', marginLeft: 8 }}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 16 },
  profileCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', marginBottom: 3 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  info: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 14, gap: 10 },
  infoSectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13 },
  value: { fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'right' },
  options: { marginTop: 14, gap: 8 },
  option: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
  },
});
