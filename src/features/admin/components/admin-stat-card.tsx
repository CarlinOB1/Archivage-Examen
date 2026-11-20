import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
};

export function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  badge,
  badgeColor,
  onPress,
}: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <MaterialIcons name={icon} size={22} color={color} />
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: `${badgeColor || color}20` }]}>
            <Text style={[styles.badgeText, { color: badgeColor || color }]}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    gap: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
