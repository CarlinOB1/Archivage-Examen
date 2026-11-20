import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import type { AppUser } from '@/types/models';

export default function EditProfileScreen() {
  const store = useAppStore();
  return (
    <ProfileEditForm
      key={Object.values(store.user).join('|')}
      initialUser={store.user}
      onSave={store.updateUser}
    />
  );
}

function ProfileEditForm({
  initialUser,
  onSave,
}: {
  initialUser: AppUser;
  onSave: (user: AppUser) => Promise<void>;
}) {
  const theme = useTheme();
  const [values, setValues] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setLoading(true);
    setError('');
    try {
      await onSave(values);
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Enregistrement du profil impossible.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Annuler</Text></Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Modifier le profil</Text>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}><Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{values.firstName[0]}{values.lastName[0]}</Text></View>
        <View style={styles.form}>
          <AppTextField label="Prénom" value={values.firstName} onChangeText={(v) => set('firstName', v)} />
          <AppTextField label="Nom" value={values.lastName} onChangeText={(v) => set('lastName', v)} />
          <AppTextField label="Adresse e-mail" value={values.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
          <AppTextField label="Université" value={values.university} onChangeText={(v) => set('university', v)} />
          <AppTextField label="Filière" value={values.programme} onChangeText={(v) => set('programme', v)} />
          <AppTextField label="Niveau" value={values.level} onChangeText={(v) => set('level', v)} />
          {error ? <Text style={{ color: '#B42318' }}>{error}</Text> : null}
          <AppButton label="Enregistrer" loading={loading} onPress={save} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 460, width: '100%', alignSelf: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginVertical: 16 }, avatar: { width: 72, height: 72, borderRadius: 36, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  form: { gap: 12 },
});
