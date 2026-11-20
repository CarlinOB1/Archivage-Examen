import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { EmptyState } from '@/components/ui/states';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();

  const [opening, setOpening] = useState(false);
  const [actionError, setActionError] = useState('');

  const document = store.documents.find((item) => item.id === id);

  if (!document) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <EmptyState
          title="Document introuvable"
          description="Ce document n’existe pas ou a été retiré de la bibliothèque."
          actionLabel="Retourner à l’accueil"
          onAction={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  const statusColor =
    document.validationStatus === 'Vérifié'
      ? theme.success
      : document.validationStatus === 'Contesté'
        ? theme.warning
        : theme.primaryBright;

  const openDocument = async () => {
    setOpening(true);
    setActionError('');
    try {
      const url = await store.getDocumentUrl(document.id);
      await Linking.openURL(url);
    } catch (openError) {
      setActionError(
        openError instanceof Error ? openError.message : 'Impossible d’ouvrir le document.'
      );
    } finally {
      setOpening(false);
    }
  };

  const shareDocument = async () => {
    setActionError('');
    try {
      const url = await store.getDocumentUrl(document.id, false);
      await Share.share({
        title: document.title,
        url,
        message: `${document.title} - ${document.subjectName} (${document.level})\n${url}`,
      });
    } catch (shareError) {
      setActionError(
        shareError instanceof Error ? shareError.message : 'Impossible de partager le document.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { maxWidth: responsive.contentMaxWidth, paddingHorizontal: responsive.horizontalPadding },
        ]}>
        {/* En-tête avec bouton retour et favori */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Retour</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={document.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onPress={() => {
              void store.toggleFavorite(document.id).catch(() => undefined);
            }}
            style={[
              styles.favoriteButton,
              {
                backgroundColor: document.isFavorite ? theme.primary : theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            <MaterialIcons
              name={document.isFavorite ? 'bookmark' : 'bookmark-border'}
              size={22}
              color={document.isFavorite ? '#FFFFFF' : theme.primary}
            />
          </Pressable>
        </View>

        {/* Titre et badges */}
        <View style={styles.titleSection}>
          <View style={[styles.typeBadge, { backgroundColor: `${theme.primaryBright}18` }]}>
            <Text style={[styles.typeBadgeText, { color: theme.primaryBright }]}>{document.type}</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{document.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <MaterialIcons
              name={
                document.validationStatus === 'Vérifié'
                  ? 'verified'
                  : document.validationStatus === 'Contesté'
                    ? 'error-outline'
                    : 'schedule'
              }
              size={16}
              color={statusColor}
            />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {document.validationStatus}
            </Text>
          </View>
        </View>

        {document.description ? (
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {document.description}
          </Text>
        ) : null}

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {/* Panneau de métadonnées */}
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {[
            ['Format & Taille', `${document.fileType} · ${document.pageCount ? `${document.pageCount} pages` : 'Document'}`],
            ['Matière', document.subjectName],
            ['Niveau d’étude', document.level],
            ['Filière', document.programme || 'Générale'],
            ['Année académique', document.academicYear],
            ['Session', document.session],
            ['Établissement', document.establishment],
            ['Contributeur', document.contributorName],
            ['Téléchargements', `${document.downloadCount} fois`],
          ].map(([label, value]) => (
            <View key={label} style={[styles.row, { borderBottomColor: theme.border }]}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</Text>
              <Text style={{ color: theme.text, fontWeight: '700', flex: 1, textAlign: 'right', fontSize: 13 }}>
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions principales */}
        {document.availabilityStatus === 'Disponible' ? (
          <View style={styles.actions}>
            <AppButton label="Ouvrir le document" loading={opening} onPress={openDocument} />
            <View style={styles.secondaryActions}>
              <View style={{ flex: 1 }}>
                <AppButton label="Télécharger" variant="secondary" loading={opening} onPress={openDocument} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton label="Partager" variant="secondary" onPress={shareDocument} />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <AppButton label="Document momentanément indisponible" disabled onPress={() => {}} />
          </View>
        )}

        {/* Signaler */}
        <Pressable
          onPress={() => router.push({ pathname: '/documents/report', params: { id: document.id } })}
          style={styles.reportButton}>
          <MaterialIcons name="flag" size={18} color={theme.textSecondary} />
          <Text style={[styles.reportText, { color: theme.textSecondary }]}>
            Signaler un problème sur ce document
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { maxWidth: 800, width: '100%', alignSelf: 'center', padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 22,
    fontSize: 15,
  },
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  row: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    padding: 10,
  },
  reportText: {
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#B42318',
    marginTop: 8,
    fontSize: 13,
  },
});
