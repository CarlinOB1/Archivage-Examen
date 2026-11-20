import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function RegisterScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '', confirmation: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setError('');
    setSuccess('');
    if (Object.values(values).some((value) => !value.trim())) return setError('Tous les champs sont obligatoires.');
    if (!values.email.includes('@')) return setError('Adresse e-mail invalide.');
    if (values.password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    if (values.password !== values.confirmation) return setError('Les mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      const needsEmailConfirmation = await store.signUp(values);
      if (needsEmailConfirmation) {
        setSuccess('Compte créé. Vérifiez votre adresse e-mail avant de vous connecter.');
      } else {
        router.replace('/(tabs)');
      }
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Création du compte impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: responsive.isTablet ? 560 : 460, paddingHorizontal: responsive.horizontalPadding }]}>
        <Text style={[styles.title, { color: theme.text }]}>Inscription</Text>
        <View style={styles.form}>
          <AppTextField label="Prénom" value={values.firstName} onChangeText={(v) => set('firstName', v)} />
          <AppTextField label="Nom" value={values.lastName} onChangeText={(v) => set('lastName', v)} />
          <AppTextField label="Adresse e-mail" value={values.email} onChangeText={(v) => set('email', v)} autoCapitalize="none" keyboardType="email-address" />
          <AppTextField label="Mot de passe" value={values.password} onChangeText={(v) => set('password', v)} secureTextEntry />
          <AppTextField label="Confirmer le mot de passe" value={values.confirmation} onChangeText={(v) => set('confirmation', v)} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <AppButton label="Créer un compte" loading={loading} onPress={submit} />
          <Pressable onPress={() => router.back()}><Text style={[styles.link, { color: theme.primaryBright }]}>Retour à la connexion</Text></Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 460, width: '100%', alignSelf: 'center', padding: 24, justifyContent: 'center', flex: 1 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 24 }, form: { gap: 12 },
  error: { color: '#B42318' }, success: { color: '#18794E' }, link: { textAlign: 'center', paddingVertical: 8, fontWeight: '700' },
});
