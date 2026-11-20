import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & { label: string; error?: string };

export function AppTextField({ label, error, style, ...props }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: error ? '#B42318' : theme.border }, style]}
        placeholderTextColor={theme.textSecondary}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  error: { color: '#B42318', fontSize: 12 },
});
