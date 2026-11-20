import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { AppButton } from './app-button';

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  const theme = useTheme();
  return <View style={styles.center}><ActivityIndicator color={theme.primaryBright} /><Text style={[styles.text, { color: theme.textSecondary }]}>{label}</Text></View>;
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  return <View style={styles.center}><Text style={[styles.title, { color: theme.text }]}>{title}</Text><Text style={[styles.text, { color: theme.textSecondary }]}>{description}</Text>{actionLabel && onAction ? <View style={{ width: 220, marginTop: 16 }}><AppButton label={actionLabel} onPress={onAction} /></View> : null}</View>;
}

export function ErrorState({ message = 'Une erreur est survenue.', onRetry }: { message?: string; onRetry: () => void }) {
  const theme = useTheme();
  return <View style={styles.center}><Text style={[styles.title, { color: theme.text }]}>Impossible d&apos;afficher le contenu</Text><Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text><View style={{ width: 220, marginTop: 16 }}><AppButton label="Réessayer" onPress={onRetry} /></View></View>;
}

export function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }: { title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const theme = useTheme();
  return <View style={[styles.dialogBackdrop, StyleSheet.absoluteFill]}><View style={[styles.dialog, { backgroundColor: theme.backgroundElement }]}><Text style={[styles.title, { color: theme.text }]}>{title}</Text><Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text><View style={styles.dialogActions}><View style={{ flex: 1 }}><AppButton label="Annuler" variant="secondary" onPress={onCancel} /></View><View style={{ flex: 1 }}><AppButton label={confirmLabel} variant="danger" onPress={onConfirm} /></View></View></View></View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  text: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  dialogBackdrop: { backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  dialog: { width: '88%', maxWidth: 420, borderRadius: 20, padding: 20 },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
