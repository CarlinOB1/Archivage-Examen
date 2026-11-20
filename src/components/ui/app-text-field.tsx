import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & { label: string; error?: string };

export function AppTextField({ label, error, style, secureTextEntry, ...props }: Props) {
  const theme = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = Boolean(secureTextEntry);
  const hideContent = isPassword && !isPasswordVisible;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          {...props}
          secureTextEntry={hideContent}
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
              borderColor: error ? '#B42318' : theme.border,
            },
            isPassword && { paddingRight: 48 },
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            onPress={() => setIsPasswordVisible((v) => !v)}
            style={styles.eyeButton}>
            <MaterialIcons
              name={isPasswordVisible ? 'visibility-off' : 'visibility'}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 14, fontWeight: '700' },
  inputWrapper: { position: 'relative', width: '100%', justifyContent: 'center' },
  input: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  eyeButton: { position: 'absolute', right: 14, height: 44, width: 36, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#B42318', fontSize: 12 },
});
