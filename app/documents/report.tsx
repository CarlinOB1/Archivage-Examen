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
  const reasons = ['Document incorrect', 'Contenu illisible', 'Format erroné', 'Corrigé erroné', 'Autre'];
  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await store.submitReport(id, reason, comment);
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Le signalement n’a pas pu être envoyé.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Retour</Text></Pressable>
        {sent ? <View style={styles.sent}><Text style={[styles.title, { color: theme.text }]}>Signalement envoyé</Text><Text style={{ color: theme.textSecondary, textAlign: 'center' }}>Merci. Le document {id} sera examiné par la modération.</Text><View style={{ width: 220, marginTop: 20 }}><AppButton label="Retour au document" onPress={() => router.back()} /></View></View> : (
          <><Text style={[styles.title, { color: theme.text }]}>Signaler le document</Text><Text style={{ color: theme.textSecondary, marginBottom: 16 }}>Sélectionnez le motif principal.</Text><View style={styles.reasons}>{reasons.map((item) => <Pressable key={item} onPress={() => setReason(item)} style={[styles.reason, { borderColor: reason === item ? theme.primaryBright : theme.border, backgroundColor: reason === item ? theme.backgroundSelected : theme.backgroundElement }]}><Text style={{ color: theme.text, fontWeight: reason === item ? '800' : '600' }}>{item}</Text></Pressable>)}</View><AppTextField label="Commentaire facultatif" value={comment} onChangeText={setComment} multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }} />{error ? <Text style={{ color: '#B42318' }}>{error}</Text> : null}<View style={{ marginTop: 12 }}><AppButton label="Envoyer" loading={loading} disabled={!reason} onPress={submit} /></View></>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 600, width: '100%', alignSelf: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 12, marginBottom: 12 }, reasons: { gap: 8, marginBottom: 16 },
  reason: { height: 48, borderWidth: 1, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 14 }, sent: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center' },
});
