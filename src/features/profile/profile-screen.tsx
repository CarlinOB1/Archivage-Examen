import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function ProfileScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [logout, setLogout] = useState(false);
  const options = [
    ['Modifier le profil', '/profile/edit'],
    ['Paramètres', '/settings'],
    ['Notifications', '/notifications'],
    ['Aide et informations', '/settings'],
  ];
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {logout ? <ConfirmDialog title="Se déconnecter ?" message="Vous devrez vous reconnecter pour accéder à certaines actions." confirmLabel="Déconnecter" onCancel={() => setLogout(false)} onConfirm={() => { void store.logout().then(() => { setLogout(false); router.replace('/auth/login'); }).catch(() => undefined); }} /> : null}
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: responsive.contentMaxWidth, paddingHorizontal: responsive.horizontalPadding, paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Profil</Text>
        <View style={[styles.profileCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={styles.initials}>{store.user.firstName[0]}{store.user.lastName[0]}</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.name, { color: theme.text }]}>{store.user.firstName} {store.user.lastName}</Text><Text style={{ color: theme.textSecondary }}>{store.user.email}</Text></View>
        </View>
        <View style={[styles.info, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Université</Text><Text style={[styles.value, { color: theme.text }]}>{store.user.university}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Filière</Text><Text style={[styles.value, { color: theme.text }]}>{store.user.programme}</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Niveau</Text><Text style={[styles.value, { color: theme.text }]}>{store.user.level}</Text>
        </View>
        <View style={styles.options}>{options.map(([label, route]) => <Pressable key={route + label} onPress={() => router.push(route)} style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><Text style={{ color: theme.text, fontWeight: '700' }}>{label}</Text><Text style={{ color: theme.textSecondary }}>›</Text></Pressable>)}</View>
        <Pressable onPress={() => setLogout(true)} style={styles.logout}><Text style={{ color: '#B42318', fontWeight: '800' }}>Se déconnecter</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 16 },
  profileCard: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, initials: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', marginBottom: 3 }, info: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 12 },
  label: { fontSize: 12, marginTop: 8 }, value: { fontSize: 15, fontWeight: '700', marginTop: 2 }, options: { marginTop: 12, gap: 8 },
  option: { height: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logout: { alignItems: 'center', marginTop: 20, padding: 12 },
});
