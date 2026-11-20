import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/states';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import { useResponsive } from '@/hooks/use-responsive';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [opening, setOpening] = useState(false);
  const [actionError, setActionError] = useState('');
  const document = store.documents.find((item) => item.id === id);
  if (!document) return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}><EmptyState title="Document introuvable" description="Ce document n’existe pas dans le catalogue Supabase." actionLabel="Retour" onAction={() => router.back()} /></SafeAreaView>;
  const statusColor = document.validationStatus === 'Vérifié' ? theme.success : document.validationStatus === 'Contesté' ? theme.warning : theme.primaryBright;
  const openDocument = async () => {
    setOpening(true);
    setActionError('');
    try {
      const url = await store.getDocumentUrl(document.id);
      await Linking.openURL(url);
    } catch (openError) {
      setActionError(openError instanceof Error ? openError.message : 'Impossible d’ouvrir le document.');
    } finally {
      setOpening(false);
    }
  };
  const shareDocument = async () => {
    setActionError('');
    try {
      const url = await store.getDocumentUrl(document.id, false);
      await Share.share({ title: document.title, url, message: `${document.title}\n${url}` });
    } catch (shareError) {
      setActionError(shareError instanceof Error ? shareError.message : 'Impossible de partager le document.');
    }
  };
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.container, { maxWidth: responsive.contentMaxWidth, paddingHorizontal: responsive.horizontalPadding }]}>
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Retour</Text></Pressable><Pressable accessibilityLabel={document.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} onPress={() => { void store.toggleFavorite(document.id).catch(() => undefined); }} style={[styles.favorite, { backgroundColor: document.isFavorite ? theme.primary : theme.backgroundElement, borderColor: theme.border }]}><Bookmark size={20} color={document.isFavorite ? '#fff' : theme.primary} fill={document.isFavorite ? '#fff' : 'none'} /></Pressable></View>
        <Text style={[styles.title, { color: theme.text }]}>{document.title}</Text>
        <View style={[styles.status, { backgroundColor: `${statusColor}18` }]}><Text style={{ color: statusColor, fontWeight: '800' }}>{document.validationStatus}</Text></View>
        <Text style={[styles.description, { color: theme.textSecondary }]}>{document.description}</Text>
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {[
            ['Format', `${document.fileType} · ${document.pageCount} pages`],
            ['Matière', document.subjectName],
            ['Niveau', document.level],
            ['Année', document.academicYear],
            ['Session', document.session],
            ['Établissement', document.establishment],
            ['Filière', document.programme],
            ['Contributeur', document.contributorName],
            ['Téléchargements', String(document.downloadCount)],
          ].map(([label, value]) => <View key={label} style={styles.row}><Text style={{ color: theme.textSecondary }}>{label}</Text><Text style={{ color: theme.text, fontWeight: '700', flex: 1, textAlign: 'right' }}>{value}</Text></View>)}
        </View>
        {document.availabilityStatus === 'Disponible' ? (
          <View style={styles.actions}>
            <AppButton label="Ouvrir le document" loading={opening} onPress={openDocument} />
            <View style={styles.secondaryActions}><View style={{ flex: 1 }}><AppButton label="Télécharger" variant="secondary" loading={opening} onPress={openDocument} /></View><View style={{ flex: 1 }}><AppButton label="Partager" variant="secondary" onPress={shareDocument} /></View></View>
          </View>
        ) : <View style={{ marginTop: 16 }}><AppButton label="Document indisponible" disabled onPress={() => {}} /></View>}
        <Pressable onPress={() => router.push({ pathname: '/documents/report', params: { id: document.id } })} style={styles.report}><Text style={{ color: theme.textSecondary }}>Signaler un problème</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favorite: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 18 }, status: { alignSelf: 'flex-start', marginTop: 12, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  description: { marginTop: 14, lineHeight: 22 }, panel: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginTop: 18 },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: '#DFE7F1' },
  actions: { marginTop: 20, gap: 10 }, secondaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, report: { alignItems: 'center', marginTop: 20, padding: 10 }, error: { color: '#B42318', marginTop: 12 },
});
