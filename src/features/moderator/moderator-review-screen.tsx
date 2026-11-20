import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/stores/app-store';
import type { RejectionReason } from '@/types/models';
import { RejectionForm } from './components/rejection-form';
import { ReviewChecklist } from './components/review-checklist';

type Step = 'verify' | 'decide' | 'done';

export default function ModeratorReviewScreen() {
  const theme = useTheme();
  const responsive = useResponsive();
  const store = useAppStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [step, setStep] = useState<Step>('verify');
  const [allChecked, setAllChecked] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showContestedModal, setShowContestedModal] = useState(false);
  const [contestComment, setContestComment] = useState('');
  const [finalDecision, setFinalDecision] = useState<string | null>(null);

  const pendingDocs = store.documents.filter((d) => d.validationStatus === 'En attente');
  const doc = store.documents.find((d) => d.id === id);
  const docIndex = pendingDocs.findIndex((d) => d.id === id);
  const nextPendingDoc = pendingDocs[docIndex + 1];

  if (!doc) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.notFound}>
          <MaterialIcons name="error-outline" size={56} color={theme.textSecondary} />
          <Text style={[styles.notFoundText, { color: theme.text }]}>Document introuvable</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtnSmall}>
            <Text style={{ color: theme.primaryBright, fontWeight: '800' }}>Retour à la file</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function handleValidate() {
    if (!doc) return;
    await store.validateDocument(doc.id, 'Vérifié');
    store.addModerationAction({
      id: Date.now().toString(),
      documentId: doc.id,
      documentTitle: doc.title,
      moderatorName: `${store.user.firstName} ${store.user.lastName}`.trim() || 'Modérateur',
      decision: 'Vérifié',
      createdAt: new Date().toISOString(),
    });
    setFinalDecision('Vérifié');
    setStep('done');
  }

  async function handleReject(reason: RejectionReason, comment: string) {
    if (!doc) return;
    await store.validateDocument(doc.id, 'Rejeté');
    store.addModerationAction({
      id: Date.now().toString(),
      documentId: doc.id,
      documentTitle: doc.title,
      moderatorName: `${store.user.firstName} ${store.user.lastName}`.trim() || 'Modérateur',
      decision: 'Rejeté',
      reason: `${reason}${comment ? ` — ${comment}` : ''}`,
      createdAt: new Date().toISOString(),
    });
    setShowRejectForm(false);
    setFinalDecision('Rejeté');
    setStep('done');
  }

  async function handleContested() {
    if (!doc) return;
    await store.validateDocument(doc.id, 'Contesté');
    store.addModerationAction({
      id: Date.now().toString(),
      documentId: doc.id,
      documentTitle: doc.title,
      moderatorName: `${store.user.firstName} ${store.user.lastName}`.trim() || 'Modérateur',
      decision: 'Contesté',
      reason: contestComment || undefined,
      createdAt: new Date().toISOString(),
    });
    setShowContestedModal(false);
    setContestComment('');
    setFinalDecision('Contesté');
    setStep('done');
  }

  async function openDoc() {
    if (!doc) return;
    const url = await store.getDocumentUrl(doc.id, false).catch(() => null);
    if (url) await Linking.openURL(url).catch(() => undefined);
  }

  const doneColor =
    finalDecision === 'Vérifié' ? '#16A34A' : finalDecision === 'Rejeté' ? '#B42318' : '#D97706';
  const doneIcon =
    finalDecision === 'Vérifié' ? 'check-circle' : finalDecision === 'Rejeté' ? 'cancel' : 'warning';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Rejection form */}
      <RejectionForm
        visible={showRejectForm}
        onCancel={() => setShowRejectForm(false)}
        onConfirm={handleReject}
      />

      {/* Contested modal */}
      <Modal visible={showContestedModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.contestSheet, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.handle} />
            <Text style={[styles.contestTitle, { color: theme.text }]}>⚠️ Contester le document</Text>
            <Text style={[styles.contestSubtitle, { color: theme.textSecondary }]}>
              Décrivez le problème pour permettre une révision ultérieure
            </Text>
            <TextInput
              value={contestComment}
              onChangeText={setContestComment}
              placeholder="Raison de la contestation..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              style={[
                styles.contestInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
            />
            <View style={styles.contestActions}>
              <Pressable
                onPress={() => {
                  setShowContestedModal(false);
                  setContestComment('');
                }}
                style={[styles.contestBtn, styles.contestCancel, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontWeight: '700' }}>Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleContested}
                style={[styles.contestBtn, styles.contestConfirm, { backgroundColor: '#D97706' }]}
              >
                <MaterialIcons name="warning" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Confirmer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            maxWidth: responsive.contentMaxWidth,
            paddingHorizontal: responsive.horizontalPadding,
            paddingBottom: 40,
          },
        ]}
      >
        {/* Back + progress */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>File</Text>
          </Pressable>
          {pendingDocs.length > 0 ? (
            <View style={[styles.progressBadge, { backgroundColor: '#D9770620' }]}>
              <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '700' }}>
                {docIndex + 1}/{pendingDocs.length} en attente
              </Text>
            </View>
          ) : null}
        </View>

        {/* Document info */}
        <View style={[styles.docInfo, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Text style={[styles.docTitle, { color: theme.text }]}>{doc.title}</Text>
          <View style={styles.docMeta}>
            <Text style={[styles.docMetaText, { color: theme.textSecondary }]}>
              {doc.type} · {doc.subjectName} · {doc.level}
            </Text>
            <Text style={[styles.docMetaText, { color: theme.textSecondary }]}>
              {doc.session} {doc.academicYear}
            </Text>
          </View>
          <Pressable
            onPress={openDoc}
            style={[styles.openDocBtn, { borderColor: '#D97706', backgroundColor: '#D9770610' }]}
          >
            <MaterialIcons name="open-in-new" size={18} color="#D97706" />
            <Text style={{ color: '#D97706', fontWeight: '800', fontSize: 14 }}>Lire le document</Text>
          </Pressable>
        </View>

        {/* Step indicators */}
        <View style={styles.stepIndicator}>
          {(['verify', 'decide'] as const).map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      step === s
                        ? '#D97706'
                        : (s === 'verify' && (step === 'decide' || step === 'done')) ||
                          (s === 'decide' && step === 'done')
                        ? '#16A34A'
                        : theme.border,
                  },
                ]}
              >
                <Text style={styles.stepCircleText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
                {s === 'verify' ? 'Vérification' : 'Décision'}
              </Text>
            </View>
          ))}
        </View>

        {/* STEP 1: Vérification */}
        {step === 'verify' ? (
          <>
            <ReviewChecklist onAllChecked={setAllChecked} />
            <Pressable
              onPress={() => setStep('decide')}
              disabled={!allChecked}
              style={[styles.nextBtn, { backgroundColor: '#D97706', opacity: allChecked ? 1 : 0.4 }]}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                Passer à la décision →
              </Text>
            </Pressable>
          </>
        ) : null}

        {/* STEP 2: Décision */}
        {step === 'decide' ? (
          <View style={styles.decideContainer}>
            <Text style={[styles.decideTitle, { color: theme.text }]}>Quelle est votre décision ?</Text>

            <Pressable
              onPress={handleValidate}
              style={[styles.decisionBtn, { backgroundColor: '#16A34A' }]}
            >
              <MaterialIcons name="check-circle" size={28} color="#fff" />
              <View>
                <Text style={styles.decisionBtnTitle}>✅ Valider</Text>
                <Text style={styles.decisionBtnSub}>Le document est conforme et lisible</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setShowContestedModal(true)}
              style={[styles.decisionBtn, { backgroundColor: '#D97706' }]}
            >
              <MaterialIcons name="warning" size={28} color="#fff" />
              <View>
                <Text style={styles.decisionBtnTitle}>⚠️ Contester</Text>
                <Text style={styles.decisionBtnSub}>Le document nécessite une révision</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setShowRejectForm(true)}
              style={[styles.decisionBtn, { backgroundColor: '#B42318' }]}
            >
              <MaterialIcons name="cancel" size={28} color="#fff" />
              <View>
                <Text style={styles.decisionBtnTitle}>❌ Rejeter</Text>
                <Text style={styles.decisionBtnSub}>Le document ne respecte pas les critères</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setStep('verify')} style={styles.goBackLink}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>← Retour à la vérification</Text>
            </Pressable>
          </View>
        ) : null}

        {/* STEP 3: Done */}
        {step === 'done' ? (
          <View style={styles.doneContainer}>
            <MaterialIcons name={doneIcon} size={72} color={doneColor} />
            <Text style={[styles.doneTitle, { color: doneColor }]}>
              Document {finalDecision} !
            </Text>
            <Text style={[styles.doneSubtitle, { color: theme.textSecondary }]}>
              {`Votre décision a été enregistrée dans l'historique.`}
            </Text>
            <View style={styles.doneActions}>
              {nextPendingDoc ? (
                <Pressable
                  onPress={() => {
                    setStep('verify');
                    setAllChecked(false);
                    setFinalDecision(null);
                    router.replace(`/moderator/review/${nextPendingDoc.id}` as any);
                  }}
                  style={[styles.doneBtn, { backgroundColor: '#D97706' }]}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Document suivant →</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => router.replace('/moderator/queue' as any)}
                style={[styles.doneBtn, styles.doneBtnOutline, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontWeight: '700' }}>Retour à la file</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingTop: 16, gap: 16 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18, fontWeight: '800' },
  backBtnSmall: { marginTop: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 15, fontWeight: '700' },
  progressBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  docInfo: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  docTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  docMeta: { gap: 2 },
  docMetaText: { fontSize: 13 },
  openDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 4,
  },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepLabel: { fontSize: 12 },
  nextBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decideContainer: { gap: 12 },
  decideTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  decisionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 18,
  },
  decisionBtnTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  decisionBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  goBackLink: { alignItems: 'center', paddingVertical: 8 },
  doneContainer: { alignItems: 'center', paddingTop: 24, gap: 12 },
  doneTitle: { fontSize: 24, fontWeight: '800' },
  doneSubtitle: { fontSize: 14, textAlign: 'center' },
  doneActions: { width: '100%', gap: 10, marginTop: 8 },
  doneBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnOutline: { borderWidth: 1 },
  overlay: { flex: 1, backgroundColor: '#00000070', justifyContent: 'flex-end' },
  contestSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 16 },
  contestTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  contestSubtitle: { fontSize: 13, marginBottom: 16 },
  contestInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  contestActions: { flexDirection: 'row', gap: 10 },
  contestBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  contestCancel: { borderWidth: 1 },
  contestConfirm: {},
});
