import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PopularSubjectCard } from '@/components/cards/popular-subject-card';
import { RecentResourceCard } from '@/components/cards/recent-resource-card';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function HomeScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await store.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [store]);

  const popularSubjects = store.subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    documentCount: subject.documentCount,
    icon: subject.iconKey,
  }));

  const recentResources = store.documents.slice(0, 4).map((document) => ({
    id: document.id,
    title: document.title,
    subject: document.subjectName,
    level: document.level,
    year: document.academicYear,
    type: document.type,
    downloads: document.downloadCount,
  }));

  const submitSearch = () => {
    const query = searchQuery.trim();
    router.push({ pathname: '/search', params: query ? { query } : undefined });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primaryBright]}
            tintColor={theme.primaryBright}
          />
        }
        contentContainerStyle={[
          styles.contentContainer,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: responsive.isSmall ? 72 : BottomTabInset + Spacing.five,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={Platform.OS === 'web' ? styles.webBrandHidden : undefined}>
            <ThemedText style={styles.brandName}>Archivage</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.brandSubtitle}>
              Examen · Université Marien Ngouabi
            </ThemedText>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voir les notifications"
              onPress={() => router.push('/notifications')}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <MaterialIcons name="notifications-none" size={22} color={theme.primary} />
              {store.notifications.some((notification) => !notification.isRead) ? (
                <View style={[styles.notificationDot, { borderColor: theme.background }]} />
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le profil"
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [
                styles.profileButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <MaterialIcons name="person" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.welcome}>
          <ThemedText style={styles.welcomeTitle}>
            Bonjour{store.user.firstName ? `, ${store.user.firstName}` : ', étudiant'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.welcomeSubtitle}>
            Que souhaitez-vous réviser aujourd’hui ?
          </ThemedText>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <MaterialIcons name="search" size={22} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={submitSearch}
            placeholder="Rechercher une matière, un examen ou un cours"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Matières populaires
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.sectionAction}>
              <ThemedText style={[styles.sectionActionText, { color: theme.primaryBright }]}>
                Voir tout
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subjectsRow}>
            {popularSubjects.map((subject) => (
              <PopularSubjectCard
                key={subject.id}
                subject={subject}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/explore',
                    params: { subject: subject.name },
                  })
                }
              />
            ))}
            {!popularSubjects.length ? (
              <ThemedText themeColor="textSecondary">
                {store.isLoading ? 'Chargement des matières…' : 'Aucune matière disponible.'}
              </ThemedText>
            ) : null}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Dernières ressources
            </ThemedText>
          </View>

          <View style={styles.resourcesList}>
            {recentResources.map((resource) => (
              <RecentResourceCard
                key={resource.id}
                resource={resource}
                onPress={() => router.push(`/documents/${resource.id}`)}
              />
            ))}
            {!recentResources.length ? (
              <ThemedText themeColor="textSecondary">
                {store.isLoading ? 'Chargement des documents…' : 'Aucun document publié pour le moment.'}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  webBrandHidden: {
    display: 'none',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginLeft: Platform.OS === 'web' ? 'auto' : 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E59B32',
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.75,
  },
  welcome: {
    marginTop: Spacing.four,
  },
  welcomeTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    marginTop: 2,
  },
  searchBar: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.two,
  },
  section: {
    marginTop: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionAction: {
    paddingVertical: 4,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subjectsRow: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  resourcesList: {
    gap: Spacing.two,
  },
});
