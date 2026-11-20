import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function LoginScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.includes('@') || password.length < 6) {
      setError('Renseignez une adresse e-mail valide et un mot de passe de 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await store.signIn(email, password);
      setLoading(false);
      router.replace('/(tabs)');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Connexion impossible. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: responsive.isTablet ? 560 : 460, paddingHorizontal: responsive.horizontalPadding }]}>
        <Text style={[styles.title, { color: theme.text }]}>Connexion</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Accédez à votre bibliothèque académique.</Text>
        {!store.isConfigured ? <Text style={styles.error}>La connexion à Supabase doit être configurée pour utiliser l’application.</Text> : null}
        <View style={styles.form}>
          <AppTextField label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="nom@exemple.com" />
          <AppTextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 6 caractères" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton label="Se connecter" loading={loading} onPress={submit} />
          <Pressable onPress={() => router.push('/auth/forgot-password')}><Text style={[styles.link, { color: theme.primaryBright }]}>Mot de passe oublié ?</Text></Pressable>
          <Pressable onPress={() => router.push('/auth/register')}><Text style={[styles.link, { color: theme.primaryBright }]}>Créer un compte</Text></Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, maxWidth: 460, width: '100%', alignSelf: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { marginTop: 8, marginBottom: 28 },
  form: { gap: 14 },
  error: { color: '#B42318', fontSize: 13 },
  link: { textAlign: 'center', paddingVertical: 8, fontWeight: '700' },
});
