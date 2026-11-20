import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const store = useAppStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Saisissez une adresse e-mail valide.');
      return;
    }
    setLoading(true);
    try {
      await store.resetPassword(email);
      setSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Envoi des instructions impossible.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Mot de passe oublié</Text>
        {sent ? (
          <View style={styles.success}><Text style={[styles.successTitle, { color: theme.text }]}>Instructions envoyées</Text><Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation.</Text></View>
        ) : (
          <View style={styles.form}><Text style={{ color: theme.textSecondary }}>Saisissez l’adresse e-mail associée à votre compte.</Text><AppTextField label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />{error ? <Text style={{ color: '#B42318' }}>{error}</Text> : null}<AppButton label="Envoyer les instructions" loading={loading} onPress={submit} /></View>
        )}
        <Pressable onPress={() => router.back()}><Text style={[styles.link, { color: theme.primaryBright }]}>Retour à la connexion</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 460, width: '100%', alignSelf: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 20 }, form: { gap: 14 }, success: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  successTitle: { fontSize: 20, fontWeight: '800' }, link: { textAlign: 'center', marginTop: 20, fontWeight: '700' },
});
