import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '@/components/ui/states';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function SettingsScreen() {
  const theme = useTheme();
  const store = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [logout, setLogout] = useState(false);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {logout ? <ConfirmDialog title="Se déconnecter ?" message="Vous serez ramené à l’écran de connexion." confirmLabel="Déconnecter" onCancel={() => setLogout(false)} onConfirm={() => { void store.logout().then(() => { setLogout(false); router.replace('/auth/login'); }).catch(() => undefined); }} /> : null}
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Retour</Text></Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Paramètres</Text>
        <Text style={[styles.section, { color: theme.textSecondary }]}>Préférences</Text>
        <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><Text style={{ color: theme.text, fontWeight: '700' }}>Notifications</Text><Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: theme.primaryBright }} /></View>
        <Text style={[styles.section, { color: theme.textSecondary }]}>Informations</Text>
        {['Version de l’application', 'Conditions d’utilisation', 'Politique de confidentialité'].map((label) => (
          <Pressable key={label} style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><Text style={{ color: theme.text, fontWeight: '700' }}>{label}</Text><Text style={{ color: theme.textSecondary }}>›</Text></Pressable>
        ))}
        <Text style={[styles.section, { color: theme.textSecondary }]}>Compte</Text>
        <Pressable onPress={() => setLogout(true)} style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><Text style={{ color: '#B42318', fontWeight: '800' }}>Se déconnecter</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  title: { fontSize: 30, fontWeight: '800', marginTop: 12, marginBottom: 20 }, section: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  row: { height: 58, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  option: { height: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
