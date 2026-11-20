import { MaterialIcons } from '@expo/vector-icons';
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
        </Pressable>

        <Text style={[styles.title, { color: theme.text }]}>{subject?.name ?? 'Matière inconnue'}</Text>
        <Text style={{ color: theme.textSecondary, marginBottom: 20, fontSize: 15, lineHeight: 22 }}>
          {subject?.description}
        </Text>

        {documents.length ? (
          documents.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push(`/documents/${doc.id}`)}
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                <View style={[styles.badge, { backgroundColor: `${theme.primaryBright}18` }]}>
                  <Text style={{ color: theme.primaryBright, fontWeight: '700', fontSize: 12 }}>
                    {doc.type}
                  </Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {doc.level} · {doc.academicYear}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{doc.title}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.downloadInfo}>
                  <MaterialIcons name="file-download" size={14} color={theme.textSecondary} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {doc.downloadCount} téléchargements
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Aucune ressource disponible"
            description="Soyez le premier à déposer un examen ou un corrigé pour cette matière."
            actionLabel="Déposer un document"
            onAction={() => router.push('/(tabs)/upload')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  downloadInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
