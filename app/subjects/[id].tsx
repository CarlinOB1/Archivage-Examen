import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/states';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const store = useAppStore();
  const subject = store.subjects.find((item) => item.id === id);
  const documents = useMemo(() => store.documents.filter((doc) => doc.subjectId === id), [store.documents, id]);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Retour</Text></Pressable>
        <Text style={[styles.title, { color: theme.text }]}>{subject?.name ?? 'Matière inconnue'}</Text>
        <Text style={{ color: theme.textSecondary, marginBottom: 20 }}>{subject?.description}</Text>
        {documents.length ? documents.map((doc) => (
          <Pressable key={doc.id} onPress={() => router.push(`/documents/${doc.id}`)} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>{doc.type}</Text></View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{doc.title}</Text><Text style={{ color: theme.textSecondary, marginTop: 6 }}>{doc.level} · {doc.academicYear}</Text>
          </Pressable>
        )) : <EmptyState title="Aucune ressource" description="Cette matière ne possède pas encore de document." actionLabel="Explorer" onAction={() => router.replace('/(tabs)/explore')} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  title: { fontSize: 30, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }, badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 }, cardTitle: { fontSize: 17, fontWeight: '800' },
});
