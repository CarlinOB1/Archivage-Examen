import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppTextField } from '@/components/ui/app-text-field';
import { ConfirmDialog } from '@/components/ui/states';
import { BottomTabInset } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import type { AcademicDocument } from '@/types/models';

const documentTypeOptions: { type: AcademicDocument['type']; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { type: 'Examen', icon: 'assignment' },
  { type: 'Corrigé', icon: 'check-circle' },
  { type: 'Devoir', icon: 'edit-note' },
  { type: 'Cours', icon: 'menu-book' },
];

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

  const [values, setValues] = useState({
    title: '',
    subjectId: '',
    level: '',
    programme: '',
    establishment: 'Université Marien Ngouabi',
    year: '2024-2025',
    session: 'Session normale',
    type: 'Examen' as AcademicDocument['type'],
    description: '',
  });

  const setValue = (key: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const pickFile = async () => {
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const selected = result.assets[0];
      if (selected.size && selected.size > 10 * 1024 * 1024) {
        return setError('Le fichier dépasse la taille maximale de 10 Mo.');
      }
      setFile(selected);
      if (!values.title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setValue('title', cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch {
      setError('Impossible d’ouvrir le sélecteur de fichiers.');
    }
  };

  const metadataValid =
    values.title.trim() &&
    values.subjectId &&
    values.level.trim() &&
    values.year.trim() &&
    values.establishment.trim();

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
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
        type: values.type,
      });
      setSuccess(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Le dépôt a échoué.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setStep(1);
    setFile(null);
    setValues({
      title: '',
      subjectId: '',
      level: '',
      programme: '',
      establishment: 'Université Marien Ngouabi',
      year: '2024-2025',
      session: 'Session normale',
      type: 'Examen',
      description: '',
    });
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.success}>
          <View style={[styles.successIcon, { backgroundColor: theme.success }]}>
            <MaterialIcons name="done" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Dépôt enregistré !</Text>
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
            « {values.title} » a été téléversé avec succès. Il sera disponible publiquement dès validation par l’équipe de modération.
          </Text>
          <View style={{ width: '100%', marginTop: 28, gap: 10 }}>
            <AppButton label="Retourner à l’accueil" onPress={resetForm} />
            <AppButton label="Déposer un autre document" variant="secondary" onPress={resetForm} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {cancel ? (
        <ConfirmDialog
          title="Annuler le dépôt ?"
          message="Toutes les informations saisies seront perdues."
          confirmLabel="Abandonner"
          onCancel={() => setCancel(false)}
          onConfirm={() => {
            setCancel(false);
            resetForm();
          }}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: responsive.isSmall ? 72 : BottomTabInset + 24,
          },
        ]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Déposer un document</Text>
            <Text style={{ color: theme.textSecondary, marginTop: 2 }}>
              Partagez une épreuve ou un cours avec la communauté
            </Text>
          </View>
          {step > 1 ? (
            <Pressable onPress={() => setCancel(true)} hitSlop={8}>
              <Text style={{ color: '#B42318', fontWeight: '700' }}>Annuler</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Stepper visuel 1 - 2 - 3 */}
        <View style={styles.stepperContainer}>
          {[
            { num: 1, label: 'Fichier' },
            { num: 2, label: 'Détails' },
            { num: 3, label: 'Validation' },
          ].map((item, idx) => {
            const isActive = step === item.num;
            const isDone = step > item.num;
            return (
              <View key={item.num} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: isDone
                        ? theme.success
                        : isActive
                          ? theme.primaryBright
                          : theme.border,
                    },
                  ]}>
                  {isDone ? (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepBadgeText}>{item.num}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: isActive || isDone ? theme.text : theme.textSecondary },
                  ]}>
                  {item.label}
                </Text>
                {idx < 2 ? (
                  <View
                    style={[
                      styles.stepConnector,
                      { backgroundColor: isDone ? theme.success : theme.border },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Étape 1 : Fichier */}
        {step === 1 ? (
          <View style={styles.step}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Sélectionnez le fichier à déposer</Text>
            <Pressable
              onPress={pickFile}
              style={[
                styles.dropzone,
                { backgroundColor: theme.backgroundElement, borderColor: file ? theme.success : theme.border },
              ]}>
              {file ? (
                <>
                  <View style={[styles.fileIconBox, { backgroundColor: theme.backgroundSelected }]}>
                    <MaterialIcons name="description" size={38} color={theme.primaryBright} />
                  </View>
                  <Text style={[styles.fileName, { color: theme.text }]}>{file.name}</Text>
                  <Text style={{ color: theme.textSecondary }}>
                    {file.mimeType ?? 'Format détecté'} · {file.size ? Math.ceil(file.size / 1024) : 0} Ko
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.uploadIconBox, { backgroundColor: theme.backgroundSelected }]}>
                    <MaterialIcons name="cloud-upload" size={40} color={theme.primaryBright} />
                  </View>
                  <Text style={{ color: theme.text, fontWeight: '800', marginTop: 12, fontSize: 16 }}>
                    Parcourir les fichiers
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 6, textAlign: 'center' }}>
                    PDF, documents Word ou images · Jusqu’à 10 Mo
                  </Text>
                </>
              )}
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={[styles.actions, responsive.isCompact && styles.actionsColumn]}>
              <View style={responsive.isCompact ? styles.actionFull : styles.actionHalf}>
                <AppButton
                  label={file ? 'Remplacer le fichier' : 'Choisir un fichier'}
                  variant="secondary"
                  onPress={pickFile}
                />
              </View>
              <View style={responsive.isCompact ? styles.actionFull : styles.actionHalf}>
                <AppButton label="Continuer vers les détails" disabled={!file} onPress={() => setStep(2)} />
              </View>
            </View>
          </View>
        ) : step === 2 ? (
          /* Étape 2 : Métadonnées et type de document */
          <View style={styles.step}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Informations sur la ressource</Text>

            {/* Sélecteur Type de document (Amélioration Ergonomique Majeure) */}
            <Text style={[styles.label, { color: theme.text }]}>Type de document</Text>
            <View style={styles.subjectChips}>
              {documentTypeOptions.map((opt) => (
                <Pressable
                  key={opt.type}
                  onPress={() => setValue('type', opt.type)}
                  style={[
                    styles.typeChip,
                    {
                      borderColor: values.type === opt.type ? theme.primary : theme.border,
                      backgroundColor: values.type === opt.type ? theme.primary : theme.backgroundElement,
                    },
                  ]}>
                  <MaterialIcons
                    name={opt.icon}
                    size={18}
                    color={values.type === opt.type ? '#fff' : theme.textSecondary}
                  />
                  <Text
                    style={{
                      color: values.type === opt.type ? '#fff' : theme.text,
                      fontWeight: '700',
                      marginLeft: 6,
                    }}>
                    {opt.type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AppTextField
              label="Titre de la ressource *"
              value={values.title}
              onChangeText={(v) => setValue('title', v)}
              placeholder="Ex. Examen Réseaux L3 Session 2025"
            />

            {/* Matières */}
            <Text style={[styles.label, { color: theme.text }]}>Matière *</Text>
            <View style={styles.subjectChips}>
              {store.subjects.map((subject) => (
                <Pressable
                  key={subject.id}
                  onPress={() => setValue('subjectId', subject.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: values.subjectId === subject.id ? theme.primary : theme.border,
                      backgroundColor:
                        values.subjectId === subject.id ? theme.primary : theme.backgroundElement,
                    },
                  ]}>
                  <Text
                    style={{
                      color: values.subjectId === subject.id ? '#fff' : theme.text,
                      fontWeight: '700',
                    }}>
                    {subject.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <AppTextField
                  label="Niveau d’étude *"
                  value={values.level}
                  onChangeText={(v) => setValue('level', v)}
                  placeholder="Ex. Licence 3"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppTextField
                  label="Année académique *"
                  value={values.year}
                  onChangeText={(v) => setValue('year', v)}
                  placeholder="2024-2025"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <AppTextField
                  label="Session"
                  value={values.session}
                  onChangeText={(v) => setValue('session', v)}
                  placeholder="Session normale"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppTextField
                  label="Filière"
                  value={values.programme}
                  onChangeText={(v) => setValue('programme', v)}
                  placeholder="Informatique"
                />
              </View>
            </View>

            <AppTextField
              label="Établissement *"
              value={values.establishment}
              onChangeText={(v) => setValue('establishment', v)}
              placeholder="Université Marien Ngouabi"
            />

            <AppTextField
              label="Description (facultatif)"
              value={values.description}
              onChangeText={(v) => setValue('description', v)}
              multiline
              numberOfLines={3}
              placeholder="Précisions sur les exercices, chapitres couverts..."
              style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
            />

            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <AppButton label="Retour" variant="secondary" onPress={() => setStep(1)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  label="Vérifier le dépôt"
                  disabled={!metadataValid}
                  onPress={() => setStep(3)}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Étape 3 : Vérification avant dépôt */
          <View style={styles.step}>
            <Text style={[styles.subtitle, { color: theme.text }]}>Récapitulatif avant envoi</Text>
            <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {[
                ['Fichier', file?.name],
                ['Type', values.type],
                ['Titre', values.title],
                [
                  'Matière',
                  store.subjects.find((subject) => subject.id === values.subjectId)?.name ?? '',
                ],
                ['Niveau', values.level],
                ['Établissement', values.establishment],
                ['Année académique', values.year],
                ['Session', values.session],
                ['Description', values.description || 'Aucune description fournie'],
              ].map(([label, value]) => (
                <View key={label} style={[styles.row, { borderBottomColor: theme.border }]}>
                  <Text style={{ color: theme.textSecondary }}>{label}</Text>
                  <Text style={{ color: theme.text, fontWeight: '700', flex: 1, textAlign: 'right' }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <AppButton label="Modifier" variant="secondary" onPress={() => setStep(2)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton label="Confirmer le dépôt" loading={loading} onPress={submit} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { width: '100%', maxWidth: 800, alignSelf: 'center', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  step: { gap: 14 },
  subtitle: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  dropzone: {
    minHeight: 200,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  uploadIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fileName: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  error: { color: '#B42318', fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  actionsColumn: { flexDirection: 'column' },
  actionFull: { width: '100%' },
  actionHalf: { flex: 1, minWidth: 160 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  subjectChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  chip: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  panel: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  row: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
  },
  success: {
    flex: 1,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
