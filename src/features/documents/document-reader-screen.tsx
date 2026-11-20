import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={22} color={theme.primaryBright} />
          <Text style={{ color: theme.primaryBright, fontWeight: '700', fontSize: 16 }}>Fermer</Text>
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>
          {document?.title ?? 'Lecteur de document'}
        </Text>
      </View>

      <View style={styles.reader}>
        <View
          style={[
            styles.page,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              maxWidth: responsive.isTablet ? 680 : 520,
              height: responsive.isSmall ? '92%' : '88%',
              padding: responsive.isSmall ? 16 : 24,
            },
          ]}>
          <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
            <MaterialIcons name="description" size={32} color={theme.primaryBright} />
          </View>
          <Text style={[styles.pageTitle, { color: theme.text }]}>{document?.title}</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 6, textAlign: 'center' }}>
            {document?.subjectName} · {document?.level} · {document?.academicYear}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={[styles.line, { backgroundColor: theme.border }]} />

          <Text style={[styles.pageText, { color: theme.text }]}>
            Prévisualisation de la page {page}
          </Text>
          <Text style={{ color: theme.textSecondary, marginTop: 12, lineHeight: 22, textAlign: 'center' }}>
            {document?.description || 'Aucune description spécifique renseignée pour ce document.'}
          </Text>

          <View style={{ marginTop: 28, width: '100%' }}>
            <AppButton label="Ouvrir le fichier original" onPress={openOriginal} />
          </View>
        </View>
      </View>

      <View style={[styles.controls, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          disabled={page <= 1}
          onPress={() => setPage((value) => Math.max(1, value - 1))}
          style={[styles.control, { opacity: page <= 1 ? 0.35 : 1 }]}>
          <MaterialIcons name="chevron-left" size={30} color={theme.text} />
        </Pressable>
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
          Page {page} / {pageCount}
        </Text>
        <Pressable
          disabled={page >= pageCount}
          onPress={() => setPage((value) => Math.min(pageCount, value + 1))}
          style={[styles.control, { opacity: page >= pageCount ? 0.35 : 1 }]}>
          <MaterialIcons name="chevron-right" size={30} color={theme.text} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 56,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: { flex: 1, fontWeight: '800', fontSize: 16 },
  reader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  page: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  line: { height: 1, width: '80%', marginVertical: 20 },
  pageText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  errorText: { color: '#B42318', marginTop: 10, textAlign: 'center' },
  controls: {
    height: 64,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
