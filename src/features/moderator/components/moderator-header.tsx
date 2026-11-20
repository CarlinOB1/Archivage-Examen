import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

const MODERATOR_COLOR = '#D97706';

type ModeratorHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ModeratorHeader({ title, subtitle, right }: ModeratorHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: `${MODERATOR_COLOR}18` }]}>
          <MaterialIcons name="verified-user" size={22} color={MODERATOR_COLOR} />
        </View>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: `${MODERATOR_COLOR}20` }]}>
          <Text style={[styles.badgeText, { color: MODERATOR_COLOR }]}>MODÉRATEUR</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
