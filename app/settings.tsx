import { MaterialIcons } from '@expo/vector-icons';
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
      {logout ? (
        <ConfirmDialog
          title="Se déconnecter ?"
          message="Vous serez ramené à l’écran de connexion."
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

      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>

        <Text style={[styles.title, { color: theme.text }]}>Paramètres</Text>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Préférences</Text>
        <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.optionLeft}>
            <MaterialIcons name="notifications-none" size={22} color={theme.primaryBright} />
            <Text style={{ color: theme.text, fontWeight: '700' }}>Notifications push</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: theme.primaryBright }} />
        </View>

        <Text style={[styles.section, { color: theme.textSecondary }]}>Informations</Text>
        {[
          { label: 'Version de l’application (1.0.0)', icon: 'info-outline' as const },
          { label: 'Conditions d’utilisation', icon: 'gavel' as const },
          { label: 'Politique de confidentialité', icon: 'privacy-tip' as const },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.optionLeft}>
              <MaterialIcons name={item.icon} size={20} color={theme.textSecondary} />
              <Text style={{ color: theme.text, fontWeight: '700' }}>{item.label}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
          </Pressable>
        ))}

        {store.isAdmin ? (
          <>
            <Text style={[styles.section, { color: theme.textSecondary }]}>Administration</Text>
            <Pressable
              onPress={() => router.push('/admin' as any)}
              style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="admin-panel-settings" size={20} color={theme.primaryBright} />
                <Text style={{ color: theme.text, fontWeight: '700' }}>Tableau de bord administrateur</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
            </Pressable>
          </>
        ) : null}

        {store.isModerator && !store.isAdmin ? (
          <>
            <Text style={[styles.section, { color: theme.textSecondary }]}>Modération</Text>
            <Pressable
              onPress={() => router.push('/moderator' as any)}
              style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.optionLeft}>
                <MaterialIcons name="verified-user" size={20} color="#D97706" />
                <Text style={{ color: theme.text, fontWeight: '700' }}>Tableau de bord modérateur</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
            </Pressable>
          </>
        ) : null}

        <Text style={[styles.section, { color: theme.textSecondary }]}>Compte</Text>
        <Pressable
          onPress={() => setLogout(true)}
          style={[styles.option, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.optionLeft}>
            <MaterialIcons name="logout" size={20} color="#B42318" />
            <Text style={{ color: '#B42318', fontWeight: '800' }}>Se déconnecter</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 20 },
  section: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  row: {
    height: 58,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  option: {
    height: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
