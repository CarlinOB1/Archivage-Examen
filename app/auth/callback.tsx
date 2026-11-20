import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const store = useAppStore();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>
          {store.isAuthenticated ? 'Adresse e-mail confirmée' : 'Lien de confirmation ouvert'}
        </Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {store.isAuthenticated
            ? 'Votre compte est prêt à être utilisé.'
            : 'Connectez-vous une fois la confirmation de votre adresse terminée.'}
        </Text>
        <AppButton
          label={store.isAuthenticated ? 'Continuer' : 'Aller à la connexion'}
          onPress={() => router.replace(store.isAuthenticated ? '/(tabs)' : '/auth/login')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, maxWidth: 460, width: '100%', alignSelf: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  message: { marginVertical: 16, textAlign: 'center', lineHeight: 22 },
});
