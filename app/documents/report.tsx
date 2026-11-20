import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function ReportDocumentScreen() {
  const theme = useTheme();
  const store = useAppStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Document incorrect',
    'Contenu illisible',
    'Format erroné',
    'Corrigé erroné',
    'Autre',
  ];

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await store.submitReport(id, reason, comment);
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Le signalement n’a pas pu être envoyé.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>

        {sent ? (
          <View style={styles.sent}>
            <View style={[styles.successIcon, { backgroundColor: theme.success }]}>
              <MaterialIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Signalement transmis</Text>
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
              Merci pour votre vigilance. Notre équipe de modération va examiner cette ressource.
            </Text>
            <View style={{ width: 220, marginTop: 24 }}>
              <AppButton label="Retour au document" onPress={() => router.back()} />
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.text }]}>Signaler un problème</Text>
            <Text style={{ color: theme.textSecondary, marginBottom: 16 }}>
              Aidez-nous à préserver la qualité des documents académiques.
            </Text>

            <View style={styles.reasons}>
              {reasons.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setReason(item)}
                  style={[
                    styles.reason,
                    {
                      borderColor: reason === item ? theme.primaryBright : theme.border,
                      backgroundColor:
                        reason === item ? theme.backgroundSelected : theme.backgroundElement,
                    },
                  ]}>
                  <MaterialIcons
                    name={reason === item ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20}
                    color={reason === item ? theme.primaryBright : theme.textSecondary}
                  />
                  <Text style={{ color: theme.text, fontWeight: reason === item ? '800' : '600' }}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AppTextField
              label="Commentaire facultatif"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              placeholder="Précisez la page illisible, l'erreur constatée..."
              style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
            />

            {error ? <Text style={{ color: '#B42318', marginTop: 8 }}>{error}</Text> : null}

            <View style={{ marginTop: 20 }}>
              <AppButton label="Transmettre le signalement" loading={loading} disabled={!reason} onPress={submit} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { maxWidth: 600, width: '100%', alignSelf: 'center', padding: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  reasons: { gap: 8, marginBottom: 16 },
  reason: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  sent: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
