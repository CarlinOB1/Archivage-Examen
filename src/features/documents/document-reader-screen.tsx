import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function DocumentReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const document = store.documents.find((item) => item.id === id);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const pageCount = document?.pageCount ?? 1;
  const openOriginal = async () => {
    if (!document) return;
    try {
      await Linking.openURL(await store.getDocumentUrl(document.id, false));
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Impossible d’ouvrir le document.');
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Fermer</Text></Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>{document?.title ?? 'Document'}</Text>
      </View>
      <View style={styles.reader}>
        <View style={[styles.page, { backgroundColor: theme.backgroundElement, maxWidth: responsive.isTablet ? 680 : 520, height: responsive.isSmall ? '92%' : '88%', padding: responsive.isSmall ? 16 : 24 }]}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>{document?.title}</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8 }}>{document?.subjectName} · {document?.academicYear}</Text>
          {error ? <Text style={{ color: '#B42318', marginTop: 12 }}>{error}</Text> : null}
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.pageText, { color: theme.text }]}>Prévisualisation locale de la page {page}</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 12, lineHeight: 22 }}>{document?.description}</Text>
          <View style={{ marginTop: 24 }}>
            <AppButton label="Ouvrir le fichier original" onPress={openOriginal} />
          </View>
        </View>
      </View>
      <View style={[styles.controls, { borderColor: theme.border }]}>
        <Pressable disabled={page <= 1} onPress={() => setPage((value) => Math.max(1, value - 1))} style={[styles.control, { opacity: page <= 1 ? 0.4 : 1 }]}><ChevronLeft color={theme.text} /></Pressable>
        <Text style={{ color: theme.text, fontWeight: '700' }}>Page {page} / {pageCount}</Text>
        <Pressable disabled={page >= pageCount} onPress={() => setPage((value) => Math.min(pageCount, value + 1))} style={[styles.control, { opacity: page >= pageCount ? 0.4 : 1 }]}><ChevronRight color={theme.text} /></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { height: 56, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  headerTitle: { flex: 1, fontWeight: '800' }, reader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  page: { width: '100%', maxWidth: 520, height: '88%', borderRadius: 10, padding: 24, justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' }, line: { height: 1, marginVertical: 24 },
  pageText: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  controls: { height: 64, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
