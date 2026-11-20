import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Upload as UploadIcon } from 'lucide-react-native';
import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { ConfirmDialog } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useAppStore } from '@/stores/app-store';
import type { AcademicDocument } from '@/types/models';

export default function UploadScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [success, setSuccess] = useState(false);
  const [values, setValues] = useState({ title: '', subjectId: '', level: '', programme: '', establishment: '', year: '', session: 'Session normale', type: 'Examen', description: '' });
  const setValue = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const pickFile = async () => {
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (selected.size && selected.size > 10 * 1024 * 1024) return setError('Le fichier dépasse la taille maximale de 10 Mo.');
      setFile(selected);
    } catch {
      setError('Impossible d’ouvrir le sélecteur de fichiers.');
    }
  };

  const metadataValid = values.title.trim() && values.subjectId && values.level && values.year && values.establishment;
  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const types: Record<string, AcademicDocument['type']> = {
        Examen: 'Examen',
        Corrigé: 'Corrigé',
        Devoir: 'Devoir',
        Cours: 'Cours',
      };
      await store.uploadDocument({
        file,
        title: values.title,
        description: values.description,
        subjectId: values.subjectId,
        level: values.level,
        academicYear: values.year,
        session: values.session,
        establishment: values.establishment,
        programme: values.programme,
        type: types[values.type] ?? 'Examen',
      });
      setSuccess(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Le dépôt a échoué.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.success}><View style={[styles.successIcon, { backgroundColor: theme.success }]}><Text style={{ color: '#fff', fontSize: 28 }}>✓</Text></View><Text style={[styles.title, { color: theme.text }]}>Dépôt enregistré</Text>      <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>{values.title} est en attente de validation.</Text><View style={{ width: '100%', marginTop: 24 }}><AppButton label="Retourner à l’accueil" onPress={() => { setSuccess(false); setStep(1); setFile(null); }} /></View><View style={{ width: '100%', marginTop: 10 }}><AppButton label="Déposer un autre document" variant="secondary" onPress={() => { setSuccess(false); setStep(1); setFile(null); setValues({ title: '', subjectId: '', level: '', programme: '', establishment: '', year: '', session: 'Session normale', type: 'Examen', description: '' }); }} /></View></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {cancel ? <ConfirmDialog title="Annuler le dépôt ?" message="Les informations saisies seront perdues." confirmLabel="Annuler" onCancel={() => setCancel(false)} onConfirm={() => { setCancel(false); setStep(1); setFile(null); setValues({ title: '', subjectId: '', level: '', programme: '', establishment: '', year: '', session: 'Session normale', type: 'Examen', description: '' }); }} /> : null}
      <ScrollView contentContainerStyle={[
        styles.container,
        {
          maxWidth: responsive.contentMaxWidth,
          paddingHorizontal: responsive.horizontalPadding,
          paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
        },
      ]}>
        <View style={styles.headerRow}><View><Text style={[styles.title, { color: theme.text }]}>Déposer un document</Text><Text style={{ color: theme.textSecondary }}>Étape {step} sur 3</Text></View>{step > 1 ? <Pressable onPress={() => setCancel(true)}><Text style={{ color: '#B42318', fontWeight: '700' }}>Annuler</Text></Pressable> : null}</View>
        {step === 1 ? (
          <View style={styles.step}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Sélectionnez un fichier</Text>
            <Pressable onPress={pickFile} style={[styles.dropzone, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {file ? <><FileText size={34} color={theme.primaryBright} /><Text style={[styles.fileName, { color: theme.text }]}>{file.name}</Text><Text style={{ color: theme.textSecondary }}>{file.mimeType ?? 'Format détecté'} · {file.size ? Math.ceil(file.size / 1024) : 0} Ko</Text></> : <><UploadIcon size={34} color={theme.primaryBright} /><Text style={{ color: theme.text, fontWeight: '700', marginTop: 10 }}>Parcourir les fichiers</Text><Text style={{ color: theme.textSecondary, marginTop: 6, textAlign: 'center' }}>PDF, image ou Word · 10 Mo maximum</Text></>}
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={[styles.actions, responsive.isCompact && styles.actionsColumn]}><View style={responsive.isCompact ? styles.actionFull : styles.actionHalf}><AppButton label={file ? 'Remplacer le fichier' : 'Choisir un fichier'} variant="secondary" onPress={pickFile} /></View><View style={responsive.isCompact ? styles.actionFull : styles.actionHalf}><AppButton label="Continuer" disabled={!file} onPress={() => setStep(2)} /></View></View>
          </View>
        ) : step === 2 ? (
          <View style={styles.step}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Informations du document</Text>
            <AppTextField label="Titre du document" value={values.title} onChangeText={(v) => setValue('title', v)} />
            <Text style={[styles.label, { color: theme.text }]}>Matière</Text><View style={styles.subjectChips}>{store.subjects.map((subject) => <Pressable key={subject.id} onPress={() => setValue('subjectId', subject.id)} style={[styles.chip, { borderColor: theme.border, backgroundColor: values.subjectId === subject.id ? theme.primary : theme.backgroundElement }]}><Text style={{ color: values.subjectId === subject.id ? '#fff' : theme.text, fontWeight: '700' }}>{subject.name}</Text></Pressable>)}</View>
            <AppTextField label="Niveau d’étude" value={values.level} onChangeText={(v) => setValue('level', v)} placeholder="Ex. Licence 3" />
            <AppTextField label="Filière" value={values.programme} onChangeText={(v) => setValue('programme', v)} />
            <AppTextField label="Établissement" value={values.establishment} onChangeText={(v) => setValue('establishment', v)} />
            <AppTextField label="Année académique" value={values.year} onChangeText={(v) => setValue('year', v)} placeholder="2024-2025" />
            <AppTextField label="Description" value={values.description} onChangeText={(v) => setValue('description', v)} multiline numberOfLines={3} style={{ height: 90, textAlignVertical: 'top', paddingTop: 12 }} />
            <View style={styles.actions}><AppButton label="Retour" variant="secondary" onPress={() => setStep(1)} /><AppButton label="Vérifier" disabled={!metadataValid} onPress={() => setStep(3)} /></View>
          </View>
        ) : (
          <View style={styles.step}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Vérification du dépôt</Text>
            <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {[['Fichier', file?.name], ['Titre', values.title], ['Matière', store.subjects.find((subject) => subject.id === values.subjectId)?.name ?? ''], ['Niveau', values.level], ['Établissement', values.establishment], ['Année', values.year], ['Session', values.session], ['Description', values.description || 'Aucune']].map(([label, value]) => <View key={label} style={styles.row}><Text style={{ color: theme.textSecondary }}>{label}</Text><Text style={{ color: theme.text, fontWeight: '700', flex: 1, textAlign: 'right' }}>{value}</Text></View>)}
            </View>
            <View style={styles.actions}><AppButton label="Modifier" variant="secondary" onPress={() => setStep(2)} /><AppButton label="Confirmer le dépôt" loading={loading} onPress={submit} /></View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 26, fontWeight: '800' },
  step: { marginTop: 24, gap: 12 }, subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  dropzone: { height: 210, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 20 },
  fileName: { fontSize: 16, fontWeight: '800', marginTop: 10, marginBottom: 4, textAlign: 'center' }, error: { color: '#B42318' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  actionsColumn: { flexDirection: 'column' },
  actionFull: { width: '100%' },
  actionHalf: { flex: 1, minWidth: 180 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 4 }, subjectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, borderRadius: 19, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  panel: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 }, row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  success: { flex: 1, maxWidth: 460, width: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
});
