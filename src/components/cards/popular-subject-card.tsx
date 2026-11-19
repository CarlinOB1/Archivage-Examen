import { Calculator, Code2, Database, Network } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Subject } from '@/data/home';
import { useTheme } from '@/hooks/use-theme';

type PopularSubjectCardProps = {
  subject: Subject;
  onPress: () => void;
};

const icons = {
  network: Network,
  code: Code2,
  database: Database,
  math: Calculator,
};

export function PopularSubjectCard({ subject, onPress }: PopularSubjectCardProps) {
  const theme = useTheme();
  const Icon = icons[subject.icon];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${subject.name}, ${subject.documentCount} documents`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSelected }]}>
        <Icon size={22} color={theme.primaryBright} strokeWidth={2} />
      </View>
      <ThemedText type="smallBold" numberOfLines={2} style={styles.name}>
        {subject.name}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.count}>
        {subject.documentCount} documents
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  name: {
    marginBottom: Spacing.half,
  },
  count: {
    fontSize: 12,
  },
});
