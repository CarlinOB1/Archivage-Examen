import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';

export default function FavoritesScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await store.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [store]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primaryBright]}
            tintColor={theme.primaryBright}
          />
        }
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
          },
        ]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Mes Favoris</Text>
          <Text style={{ color: theme.textSecondary }}>{store.favorites.length} document(s)</Text>
        </View>

        {store.favorites.length ? (
          store.favorites.map((doc) => (
            <Pressable
              key={doc.id}
              onPress={() => router.push(`/documents/${doc.id}`)}
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}>
                <MaterialIcons name="bookmark" size={24} color={theme.primaryBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{doc.title}</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {doc.type} · {doc.subjectName} · {doc.level} · {doc.academicYear}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Retirer des favoris"
                onPress={() => {
                  void store.toggleFavorite(doc.id).catch(() => undefined);
                }}
                style={styles.remove}>
                <MaterialIcons name="bookmark-remove" size={22} color="#B42318" />
              </Pressable>
            </Pressable>
          ))
        ) : (
          <EmptyState
            title="Aucun favori enregistré"
            description="Enregistrez les épreuves et cours qui vous intéressent pour les retrouver rapidement."
            actionLabel="Découvrir les ressources"
            onAction={() => router.push('/(tabs)/explore')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 30, fontWeight: '800' },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  remove: { padding: 8 },
});
