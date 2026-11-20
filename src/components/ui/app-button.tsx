import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

export function AppButton({ label, onPress, variant = 'primary', disabled, loading }: Props) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && { backgroundColor: theme.primary },
        variant === 'secondary' && { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
        danger && { backgroundColor: '#B42318' },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary || danger ? '#fff' : theme.primary} />
      ) : (
        <Text style={[styles.label, (variant !== 'primary' && !danger) && { color: theme.text }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
});
