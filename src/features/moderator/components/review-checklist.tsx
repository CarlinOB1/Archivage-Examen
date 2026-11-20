import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

const CRITERIA = [
  'Lisibilité correcte (texte/images nets)',
  'Aucune donnée personnelle visible',
  'Cohérence avec la matière indiquée',
  'Session et année académique cohérentes',
  'Format de fichier valide (PDF/image)',
];

type ReviewChecklistProps = {
  onAllChecked: (checked: boolean) => void;
};

export function ReviewChecklist({ onAllChecked }: ReviewChecklistProps) {
  const theme = useTheme();
  const [checked, setChecked] = useState<boolean[]>(new Array(CRITERIA.length).fill(false));

  function toggle(index: number) {
    const next = [...checked];
    next[index] = !next[index];
    setChecked(next);
    onAllChecked(next.every(Boolean));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>✅ Critères de vérification</Text>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Cochez chaque critère après vérification du document
      </Text>
      <View style={styles.list}>
        {CRITERIA.map((criterion, i) => (
          <Pressable
            key={criterion}
            onPress={() => toggle(i)}
            style={[
              styles.item,
              {
                backgroundColor: checked[i] ? '#16A34A18' : theme.background,
                borderColor: checked[i] ? '#16A34A' : theme.border,
              },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: checked[i] }}
          >
            <MaterialIcons
              name={checked[i] ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={checked[i] ? '#16A34A' : theme.textSecondary}
            />
            <Text style={[styles.criterion, { color: checked[i] ? '#16A34A' : theme.text }]}>
              {criterion}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        style={[
          styles.progress,
          { backgroundColor: checked.filter(Boolean).length === CRITERIA.length ? '#16A34A20' : theme.background },
        ]}
      >
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {checked.filter(Boolean).length}/{CRITERIA.length} critères validés
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 12 },
  list: { gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  criterion: { flex: 1, fontSize: 13, fontWeight: '600' },
  progress: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  progressText: { fontSize: 12, fontWeight: '700' },
});
