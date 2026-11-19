import { router } from 'expo-router';
import { Bell, Search, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PopularSubjectCard } from '@/components/cards/popular-subject-card';
import { RecentResourceCard } from '@/components/cards/recent-resource-card';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { popularSubjects, recentResources } from '@/data/home';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = () => {
    const query = searchQuery.trim();
    router.push({ pathname: '/search', params: query ? { query } : undefined });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.brandName}>Archivage</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.brandSubtitle}>
              Examen
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
              <Bell size={21} color={theme.primary} />
              <View style={[styles.notificationDot, { borderColor: theme.background }]} />
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
              <UserRound size={21} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View style={styles.welcome}>
          <ThemedText style={styles.welcomeTitle}>Bonjour, étudiant</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.welcomeSubtitle}>
            Que souhaitez-vous réviser aujourd’hui ?
          </ThemedText>
        </View>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={submitSearch}
            placeholder="Rechercher une matière ou un document"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text }]}
          />
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
    fontWeight: 800,
  },
  brandSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
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
    fontWeight: 800,
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
    fontWeight: 700,
  },
  subjectsRow: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  resourcesList: {
    gap: Spacing.two,
  },
});
