import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import type { RejectionReason } from '@/types/models';

const REJECTION_REASONS: { key: RejectionReason; label: string }[] = [
  { key: 'unreadable', label: 'Document illisible' },
  { key: 'duplicate', label: 'Document en doublon' },
  { key: 'wrong_session_year', label: 'Session/Année incorrecte' },
  { key: 'wrong_subject', label: 'Matière incorrecte' },
  { key: 'personal_data', label: 'Données personnelles présentes' },
  { key: 'incomplete', label: 'Document incomplet' },
  { key: 'other', label: 'Autre motif' },
];

type RejectionFormProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (reason: RejectionReason, comment: string) => void;
};

export function RejectionForm({ visible, onCancel, onConfirm }: RejectionFormProps) {
  const theme = useTheme();
  const [reason, setReason] = useState<RejectionReason | null>(null);
  const [comment, setComment] = useState('');

  function handleConfirm() {
    if (!reason) return;
    onConfirm(reason, comment);
    setReason(null);
    setComment('');
  }

  function handleCancel() {
    setReason(null);
    setComment('');
    onCancel();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.text }]}>❌ Motif de rejet</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sélectionnez un motif et ajoutez un commentaire si nécessaire
          </Text>
          <ScrollView style={styles.reasons} showsVerticalScrollIndicator={false}>
            {REJECTION_REASONS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setReason(item.key)}
                style={[
                  styles.reasonItem,
                  {
                    borderColor: reason === item.key ? '#B42318' : theme.border,
                    backgroundColor: reason === item.key ? '#B4231814' : theme.background,
                  },
                ]}
              >
                <MaterialIcons
                  name={reason === item.key ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={reason === item.key ? '#B42318' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.reasonLabel,
                    { color: reason === item.key ? '#B42318' : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Commentaire optionnel..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.commentInput,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
            ]}
          />
          <View style={styles.actions}>
            <Pressable onPress={handleCancel} style={[styles.btn, styles.cancelBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!reason}
              style={[styles.btn, styles.confirmBtn, { opacity: reason ? 1 : 0.4 }]}
            >
              <MaterialIcons name="cancel" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Confirmer le rejet</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000070',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  reasons: { maxHeight: 260, marginBottom: 12 },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  reasonLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelBtn: { borderWidth: 1 },
  confirmBtn: { backgroundColor: '#B42318' },
});
