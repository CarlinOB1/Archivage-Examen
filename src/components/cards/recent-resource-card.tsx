import { ChevronRight, Download, FileText } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { RecentResource } from '@/data/home';
import { useTheme } from '@/hooks/use-theme';

type RecentResourceCardProps = {
  resource: RecentResource;
  onPress: () => void;
};

export function RecentResourceCard({ resource, onPress }: RecentResourceCardProps) {
  const theme = useTheme();
  const typeColor =
    resource.type === 'Corrigé'
      ? theme.success
      : resource.type === 'Devoir'
        ? theme.warning
        : theme.primaryBright;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${resource.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.documentIcon, { backgroundColor: `${typeColor}18` }]}>
        <FileText size={22} color={typeColor} strokeWidth={2} />
      </View>

      <View style={styles.content}>
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18` }]}>
          <ThemedText style={[styles.typeText, { color: typeColor }]}>{resource.type}</ThemedText>
        </View>
        <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
          {resource.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.meta}>
          {resource.level} · {resource.year}
        </ThemedText>
        <View style={styles.downloads}>
          <Download size={13} color={theme.textSecondary} />
          <ThemedText themeColor="textSecondary" style={styles.downloadText}>
            {resource.downloads}
          </ThemedText>
        </View>
      </View>

      <ChevronRight size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  documentIcon: {
    width: 48,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  content: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  typeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: 700,
  },
  title: {
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
  },
  downloads: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  downloadText: {
    fontSize: 11,
  },
});
