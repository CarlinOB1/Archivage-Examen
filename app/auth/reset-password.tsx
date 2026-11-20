import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const store = useAppStore();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await store.updatePassword(password);
      router.replace('/(tabs)');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'La mise à jour du mot de passe a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Nouveau mot de passe</Text>
        <View style={styles.form}>
          <AppTextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
          <AppTextField label="Confirmer le mot de passe" value={confirmation} onChangeText={setConfirmation} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton label="Mettre à jour" loading={loading} onPress={submit} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, maxWidth: 460, width: '100%', alignSelf: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  form: { gap: 14 },
  error: { color: '#B42318' },
});
